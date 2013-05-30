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

    DbAdapterInterface = require('./dbAdapters/dbAdapterInterface').DbAdapterInterface,
    MongoAdapter = null,

    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick;

try { MongoAdapter = require('./dbAdapters/mongoAdapter').MongoAdapter; }
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

    if (MongoAdapter !== null) this.addAdapter('mongo', new MongoAdapter());
}

/**
 * Добавление адаптера
 *
 * @param {String} adapterName имя адаптера
 * @param {DbAdapterInterface} adapter адаптер
 *
 * @returns {DbManager}
 */
DbManager.prototype.addAdapter = function addAdapter (adapterName, adapter)
{
    //
    // проверка параметров
    //
    if (typeof adapterName !== 'string')
        throw new $swiftErrors.TypeError('Недопустимый тип имени адаптера (ожидается: "string", принято: "' + typeof adapterName+ '").');
    if (!adapterName.length)
        throw new $swiftErrors.ValueError('Недопустимое значение имени адаптера.');
    if (adapterName in this._adapters)
        throw new $swiftErrors.SystemError('Адаптер с именем "' + adapterName + '" уже существует.');
    if (!(adapter instanceof DbAdapterInterface))
        throw new $swiftErrors.TypeError('Недопустимый тип адаптера (ожидается: "DbAdapterInterface", принято: "' + typeof adapter+ '").');
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
 * @returns {DbAdapterInterface|null}
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
        cb(new $swiftErrors.TypeError('Недопустимый тип имени адаптера (ожидается: "string", принято: "' + typeof adapterName+ '").'));
        return this;
    }
    if (!adapterName.length)
    {
        cb(new $swiftErrors.ValueError('Недопустимое значение имени адаптера.'));
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
        errors = [];

    if (typeof cb !== 'function') cb = function () {};
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
                if (err instanceof $swiftErrors.MultipleError) errors = errors.concat(err.list);
                else errors.push(err);
            }

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
            if (processCount)
            {
                awaiting();
                return;
            }

            if (errors.length)
            {
                cb(new $swiftErrors.MultipleError('Ошибки удаления адаптеров.').setList(errors));
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
        errors = [];

    if (typeof cb !== 'function') cb = function () {};
    //
    // установление соединений в адаптерах
    //
    for (var adapterName in this._adapters)
    {if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processCount++;

        this.connectOne(adapterName, function (err)
        {
            if (err)
            {
                if (err instanceof $swiftErrors.MultipleError) errors = errors.concat(err.list);
                else errors.push(err);
            }

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
            if (processCount)
            {
                awaiting();
                return;
            }

            if (errors.length)
            {
                cb(new $swiftErrors.MultipleError('Ошибки установления соединений в адаптерах.').setList(errors));
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
        cb(new $swiftErrors.TypeError('Недопустимый тип имени адаптера (ожидается: "string", принято: "' + typeof adapterName + '").'));
        return this;
    }
    if (!adapterName.length)
    {
        cb(new $swiftErrors.ValueError('Недопустимое значение имени адаптера.'));
        return this;
    }
    if (!(adapterName in this._adapters))
    {
        cb(new $swiftErrors.SystemError('Адаптер с именем "' + adapterName + '" не найден.'));
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
        errors = [];

    if (typeof cb !== 'function') cb = function () {};
    //
    // разрыв соединений в адаптерах
    //
    for (var adapterName in this._adapters)
    {if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processing++;

        this.disconnectOne(adapterName, function (err)
        {
            if (err)
            {
                if (err instanceof $swiftErrors.MultipleError) errors = errors.concat(err.list);
                else errors.push(err);
            }

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
            if (processing)
            {
                awaiting();
                return;
            }

            if (errors.length)
            {
                cb(new $swiftErrors.MultipleError('Ошибки разрыва соединений в адаптерах.').setList(errors));
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
        cb(new $swiftErrors.TypeError('Недопустимый тип имени адаптера (ожидается: "string", принято: "' + typeof adapterName+ '").'));
        return this;
    }
    if (!adapterName.length)
    {
        cb(new $swiftErrors.ValueError('Недопустимое значение имени адаптера.'));
        return this;
    }
    if (!(adapterName in this._adapters))
    {
        cb(new $swiftErrors.SystemError('Адаптер с именем "' + adapterName + '" не найден.'));
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