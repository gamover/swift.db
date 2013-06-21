/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:24
 *
 * Менеджер баз данных Swift.
 */

var $util = require('util'),
    $events = require('events'),

    $swiftErrors = require('swift.errors'),
    $swiftUtils = require('swift.utils'),

    MongoAdapterPkg = require('./dbAdapters/mongoAdapter'),

    DbAdapter = require('./dbAdapters/dbAdapter').DbAdapter,

    adapters = {},
    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick;

adapters[MongoAdapterPkg.adapterType.toLowerCase()] = MongoAdapterPkg.MongoAdapter;

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
$util.inherits(DbManager, $events.EventEmitter);

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
    var adapter,
        error;

    if (typeof adapterType !== 'string')
    {
        error = new $swiftErrors.TypeError('не удалось создать адаптер в менеджере баз данных.' +
            ' Недопустимый тип типа адаптера');

        this.emit('error', error, 'createAdapter');
        throw error;
    }
    if (!(adapterType.toLowerCase() in adapters))
    {
        error = new $swiftErrors.ValueError('не удалось создать адаптер в менеджере баз данных.' +
            ' Неизвестный тип адаптера');

        this.emit('error', error, 'createAdapter');
        throw error;
    }
    //
    // создание адаптера
    //
    adapter = new adapters[adapterType]();

    if (typeof adapterName !== 'undefined')
    {
        //
        // задание имени адаптеру
        //
        adapter.setName(adapterName);
    }
    //
    // добавление адаптера в набор
    //
    this.addAdapter(adapter);

    this.emit('createAdapter', adapter);

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
        adapterSetName,
        error;

    if (!(adapter instanceof DbAdapter))
    {
        error = new $swiftErrors.TypeError('не удалось добавить адаптер в менеджере баз данных.' +
            ' Недопустимый тип типа адаптера');

        this.emit('error', error, 'addAdapter');
        throw error;
    }

    adapterName = adapter.getName();
    adapterSetName = adapter.setName;

    if (adapterName in this._adapters)
    {
        error = new $swiftErrors.TypeError('не удалось добавить ' + adapter.getType() + '-адаптер' +
            ' "' + adapterName + '" в менеджере баз данных. Адаптер с именем "' + adapterName + '" уже существует');

        this.emit('error', error, 'addAdapter');
        throw error;
    }
    //
    // перегрузка метода задания имени логгера
    //
    adapter.setName = function setName (name)
    {
        var currentName = this._name;

        if (name === currentName) return this;

        if (name in self._adapters)
        {
            error = new $swiftErrors.TypeError('не удалось задать имя "' + name + '" ' + this.getType() + '-адаптеру' +
                ' "' + currentName + '". Адаптер с именем "' + name + '" уже существует');

            this.emit('error', error, 'setName');
            throw error;
        }

        adapterSetName.call(this, name);
        //
        // изменение имени адаптера в наборе
        //
        self._adapters[name] = self._adapters[currentName];
        delete self._adapters[currentName];

        return this;
    };
    //
    // добавление адаптера
    //
    this._adapters[adapterName] = adapter;

    this.emit('addAdapter', adapter);

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
    var self = this,
        adapter,
        error;

    if (typeof cb !== 'function')
    {
        cb = function(){};
    }

    if (typeof adapterName !== 'string')
    {
        error = new $swiftErrors.TypeError('не удалось удалить адаптер в менеджере баз данных.' +
            ' Недопустимый тип имени адаптера');

        this.emit('error', error, 'removeAdapter');
        cb(error);
    }
    if (!adapterName.length)
    {
        error = new $swiftErrors.ValueError('не удалось удалить адаптер в менеджере баз данных.' +
            ' Не указано имя адаптера');

        this.emit('error', error, 'removeAdapter');
        cb(error);

        return this;
    }

    if (!(adapterName in this._adapters))
    {
        cb(null);
        return this;
    }

    adapter = this._adapters[adapterName];
    //
    // разрыв соединений адаптера
    //
    adapter.disconnect(function (err)
    {
        if (err)
        {
            error = new $swiftErrors.ValueError('не удалось удалить ' + adapter.getType() + '-адаптер' +
                ' "' + adapter.getName() + '" в менеджере баз данных (' + err.message + ')')
                .setInfo(err);

            self.emit('error', error, 'removeAdapter');
            cb(error);
            return;
        }
        //
        // удаление адаптера из набора
        //
        delete self._adapters[adapterName];

        self.emit('removeAdapter', adapterName);
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
        error,
        errors = [];

    if (typeof cb !== 'function')
    {
        cb = function () {};
    }
    //
    // удаление адаптеров
    //
    for (var adapterName in this._adapters)
    {if (!this._adapters.hasOwnProperty(adapterName)) continue;
        processCount++;

        this.removeAdapter(adapterName, function (err)
        {
            if (err)
            {
                errors.push(err);
            }

            processCount--;
        });
    }
    //
    // ожидание
    //
    (function awaiting()
    {
        immediate(function ()
        {
            if (processCount)
            {
                awaiting();
                return;
            }

            if (errors.length)
            {
                error = new $swiftErrors.MultipleError()
                    .setMessage('возникли ошибки при удалении адаптеров в менеджере баз данных')
                    .setList(errors);

                cb(error);
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
    var self = this,
        processCount = 0,
        error,
        errors = [];

    if (typeof cb !== 'function')
    {
        cb = function () {};
    }
    //
    // установление соединений в адаптерах
    //
    for (var adapterName in this._adapters)
    {if (!this._adapters.hasOwnProperty(adapterName)) continue;
        processCount++;

        this._adapters[adapterName].connect(function (err)
        {
            if (err)
            {
                errors.push(err);
            }

            processCount--;
        });
    }
    //
    // ожидание
    //
    (function awaiting()
    {
        immediate(function ()
        {
            if (processCount)
            {
                awaiting();
                return;
            }

            if (errors.length)
            {
                error = new $swiftErrors.MultipleError('не удалось установить соединения в адаптерах' +
                    ' в менеджере баз данных')
                    .setList(errors);

                self.emit('error', error, 'connect');
                cb(error);
                return;
            }

            self.emit('connect');
            cb(null);
        });
    })();

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
    var self = this,
        processCount = 0,
        error,
        errors = [];

    if (typeof cb !== 'function')
    {
        cb = function () {};
    }
    //
    // разрыв соединений в адаптерах
    //
    for (var adapterName in this._adapters)
    {if (!this._adapters.hasOwnProperty(adapterName)) continue;
        processCount++;

        this._adapters[adapterName].disconnect(function (err)
        {
            if (err)
            {
                errors.push(err);
            }

            processCount--;
        });
    }
    //
    // ожидание
    //
    (function awaiting()
    {
        immediate(function ()
        {
            if (processCount)
            {
                awaiting();
                return;
            }

            if (errors.length)
            {
                error = new $swiftErrors.MultipleError('не удалось разорвать соединения в адаптерах' +
                    ' в менеджере баз данных')
                    .setList(errors);

                self.emit('error', error, 'disconnect');
                cb(error);
                return;
            }

            self.emit('disconnect');
            cb(null);
        });
    })();

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