/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:24
 *
 * Менеджер баз данных Swift.
 */

var $swiftErrors = require('swift.errors'),
    $swiftUtils = require('swift.utils'),

    DbAdapter = require('./dbAdapters/dbAdapter').DbAdapter,

    adapters = {
        mongo: null
    },

    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick;

try { adapters.mongo = require('./dbAdapters/mongoAdapter').MongoAdapter; }
catch(e){}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbManager ()
{
    /**
     * Набор адаптеров
     *
     * @type {Object}
     * @private
     */
    this._adapters = {};
}

/**
 * Создание адаптера
 *
 * @param {String} adapterType тип адаптера
 * @param {String|undefined} adapterName имя адаптера
 *
 * @returns {DbAdapter}

 */
DbManager.prototype.createAdapter = function createAdapter (adapterType, adapterName)
{
    var adapter;
    //
    // проверка параметров
    //
    if (typeof adapterType !== 'string')
        throw new $swiftErrors.TypeError('не удалось создать адаптер в менеджере баз данных. Недопустимый тип типа адаптера (ожидается: "string", принято: "' + typeof adapterType + '")');
    if (!(adapterType.toLowerCase() in adapters))
        throw new $swiftErrors.ValueError('не удалось создать адаптер в менеджере баз данных. Недопустимое значение типа адаптера (ожидается: "' + Object.keys(adapters).join('"|"') + '", принято: "' + adapterType + '")');
    //
    // создание адаптера
    //
    adapter = new adapters[adapterType]();
    //
    // задание имени адаптеру
    //
    if (adapterName) adapter.setName(adapterName);
    //
    // добавление адаптера в набор
    //
    this.addAdapter(adapter);

    return adapter;
};

/**
 * Добавление адаптера
 *
 * @param {DbAdapter} adapter адаптер
 *
 * @returns {DbManager}
 */
DbManager.prototype.addAdapter = function addAdapter (adapter)
{
    var self = this,
        adapterName,
        adapterSetName;
    //
    // проверка параметров
    //
    if (!(adapter instanceof DbAdapter))
        throw new $swiftErrors.TypeError('не удалось добавить адаптер в менеджер баз данных. Недопустимый тип адаптера (ожидается: "DbAdapter", принято: "' + typeof adapter + '")');

    adapterName = adapter.getName();
    adapterSetName = adapter.setName;

    if (adapterName in this._adapters)
        throw new $swiftErrors.ValueError('не удалось добавить адаптер в менеджер баз данных. Адаптер с именем "' + adapterName + '" уже существует');
    //
    // перегрузка метода задания имени логгера
    //
    adapter.setName = function (name)
    {
        //
        // проверка параметров
        //
        if (typeof name !== 'string')
            throw new $swiftErrors.TypeError('не удалось изменить имя адаптеру "' + adapterName + '". Недопустимый тип имени адаптера (ожидается: "string", принято: "' + typeof name + '")');
        if (!name.length)
            throw new $swiftErrors.ValueError('не удалось изменить имя адаптеру "' + adapterName + '". Пустое значение имени адаптера');

        if (name === adapterName) return this;

        if (name in self._adapters)
            throw new $swiftErrors.ValueError('не удалось изменить имя адаптеру "' + adapterName + '". Имя "' + name + '" уже занято другим адаптером');
        //
        // задание имени адаптеру
        //
        adapterSetName.call(this, name);
        //
        // обновление набора логгеров
        //
        self._adapters[name] = self._adapters[adapterName];
        delete self._adapters[adapterName];
        adapterName = name;

        return this;
    };
    //
    // добавление адаптера
    //
    this._adapters[adapterName] = adapter;

    return this;
};

/**
 * Получение адаптера
 *
 * @param {String} adapterName имя адаптера
 *
 * @returns {DbAdapter|null}
 */
DbManager.prototype.getAdapter = function getAdapter (adapterName)
{
    return (this._adapters[adapterName] || null);
};

/**
 * Получение всех адаптеров
 *
 * @returns {Object}
 */
DbManager.prototype.getAllAdapters = function getAllAdapters ()
{
    return this._adapters;
};

/**
 * Удаление адаптера
 *
 * @param {String} adapterName имя адаптера
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.removeAdapter = function removeAdapter (adapterName, cb)
{
    var self = this;

    if (typeof cb !== 'function') cb = function(){};
    //
    // проверка параметров
    //
    if (typeof adapterName !== 'string')
    {
        cb(new $swiftErrors.TypeError('не удалось удалить адаптер из менеджера баз данных. Недопустимый тип имени адаптера (ожидается: "string", принято: "' + typeof adapterName + '")'));
        return this;
    }
    if (!adapterName.length)
    {
        cb(new $swiftErrors.ValueError('не удалось удалить адаптер из менеджера баз данных. Пустое значение имени адаптера'));
        return this;
    }

    if (!(adapterName in this._adapters))
    {
        cb(null);
        return this;
    }
    //
    // разрыв всех соединений адаптера с БД
    //
    this._adapters[adapterName].disconnect(function (err)
    {
        if (err)
        {
            cb(err);
            return;
        }
        //
        // удаление адаптера из набора
        //
        delete self._adapters[adapterName];

        cb(null);
    });

    return this;
};

/**
 * Удаление всех адаптеров
 *
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.removeAllAdapters = function removeAllAdapters (cb)
{
    var processCount = 0,
        error = null;

    if (typeof cb !== 'function') cb = function () {};
    //
    // удаление адаптеров
    //
    for (var adapterName in this._adapters)
    {if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processCount++;

        this.removeAdapter(adapterName, function (err)
        {
            if (err && !error) error = err;
            processCount--;
        });
    }
    //
    // ожидание завершения удаления адаптеров
    //
    (function awaiting()
    {
        immediate(function ()
        {
            if (error)
            {
                cb(error);
                return;
            }

            if (processCount)
            {
                awaiting();
                return;
            }

            cb(null);
        });
    })();

    return this;
};

/**
 * Установление соединений всех адаптеров
 *
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.connect = function connect (cb)
{
    var processCount = 0,
        error = null;

    if (typeof cb !== 'function') cb = function () {};
    //
    // установление соединений в адаптерах
    //
    for (var adapterName in this._adapters)
    {if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processCount++;

        this.connectOne(adapterName, function (err)
        {
            if (err && !error) error = err;
            processCount--;
        });
    }
    //
    // ожидание завершения установления соединений в адаптерах
    //
    (function awaiting()
    {
        immediate(function ()
        {
            if (error)
            {
                cb(error);
                return;
            }

            if (processCount)
            {
                awaiting();
                return;
            }

            cb(null);
        });
    })();

    return this;
};

/**
 * Установление соединений адаптера
 *
 * @param {String} adapterName имя адаптера
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.connectOne = function connectOne (adapterName, cb)
{
    //
    // проверка параметров
    //
    if (typeof adapterName !== 'string')
    {
        cb(new $swiftErrors.TypeError('не удалось установить соединения с БД через адаптер в менеджере баз данных. Недопустимый тип имени адаптера (ожидается: "string", принято: "' + typeof adapterName + '")'));
        return this;
    }
    if (!adapterName.length)
    {
        cb(new $swiftErrors.ValueError('не удалось установить соединения с БД через адаптер в менеджере баз данных. Пустое значение имени адаптера'));
        return this;
    }
    if (!(adapterName in this._adapters))
    {
        cb(new $swiftErrors.ValueError('не удалось установить соединения с БД через адаптер в менеджере баз данных. Адаптер с именем "' + adapterName + '" не найден'));
        return this;
    }
    //
    // установление соединений
    //
    this._adapters[adapterName].connect(function (err)
    {
        if (err)
        {
            cb(err);
            return;
        }

        cb(null);
    });

    return this;
};

/**
 * Разрыв соединений всех адаптеров
 *
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.disconnect = function disconnect (cb)
{
    var processing = 0,
        error = null;

    if (typeof cb !== 'function') cb = function () {};
    //
    // разрыв соединений в адаптерах
    //
    for (var adapterName in this._adapters)
    {if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processing++;

        this.disconnectOne(adapterName, function (err)
        {
            if (err && !error) error = err;
            processing--;
        });
    }
    //
    // ожидание завершения разрыва соединений в адаптерах
    //
    (function awaiting()
    {
        immediate(function ()
        {
            if (error)
            {
                cb(error);
                return;
            }

            if (processing)
            {
                awaiting();
                return;
            }

            cb(null);
        });
    })();

    return this;
};

/**
 * Разрыв соединений адаптера
 *
 * @param {String} adapterName имя адаптера
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.disconnectOne = function disconnectOne (adapterName, cb)
{
    if (typeof cb !== 'function') cb = function () {};
    //
    // проверка параметров
    //
    if (typeof adapterName !== 'string')
    {
        cb(new $swiftErrors.TypeError('не удалось разорвать соединения адаптера с БД в менеджере баз данных. Недопустимый тип имени адаптера (ожидается: "string", принято: "' + typeof adapterName+ '")'));
        return this;
    }
    if (!adapterName.length)
    {
        cb(new $swiftErrors.ValueError('не удалось разорвать соединения адаптера с БД в менеджере баз данных. Пустое значение имени адаптера'));
        return this;
    }
    if (!(adapterName in this._adapters))
    {
        cb(new $swiftErrors.ValueError('не удалось разорвать соединения адаптера с БД в менеджере баз данных. Адаптер с именем "' + adapterName + '" не найден'));
        return this;
    }
    //
    // разрыв соединений
    //
    this._adapters[adapterName].disconnect(function (err)
    {
        if (err)
        {
            cb(err);
            return;
        }

        cb(null);
    });

    return this;
};

/**
 * Прослойка коннектора с БД
 *
 * @returns {Function}
 */
DbManager.prototype.connector = function connector ()
{
    var self = this;

    return function (req, res, next)
    {
        self.connect(function (err)
        {
            if (err)
            {
                var error = new Error();

                error.status = 500;
                error.message = 'error connecting to database';

                next(error);

                return;
            }

            next();
        });
    };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbManager = DbManager;