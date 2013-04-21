/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:24
 *
 * Менеджер баз данных Swift.
 */

var $swiftUtils = require('swift.utils'),
    typeUtil = $swiftUtils.type,

    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick,

    error = require('./error'),
    DbAdapterInterface = require('./dbAdapters/dbAdapterInterface').DbAdapterInterface,
    MongoAdapter = require('./dbAdapters/mongoAdapter').MongoAdapter;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbManager () {
    /**
     * Набор адаптеров
     *
     * @type {Object}
     * @private
     */
    this._adapters = {};

    //
    ////
    //

    this.addAdapter('mongo', new MongoAdapter())
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
    if (typeof adapterName !== 'string' || !adapterName.length)
        throw new error.DbManagerError('не удалось добавить адаптер в DbManager.' +
            ' Имя адаптера не передано или представлено в недопустимом формате');
    if (adapterName in this._adapters)
        throw new error.DbManagerError('не удалось добавить адаптер в DbManager.' +
            ' Адаптер с именем "' + adapterName + '" уже существует');
    if (!(adapter instanceof DbAdapterInterface))
        throw new error.DbManagerError('не удалось добавить адаптер "' + adapterName + '" в DbManager.' +
            ' Адаптер не передан или представлен в недопустимом формате');

    this._adapters[adapterName] = adapter;

    return this;
};

/**
 * Получение адаптера по имени
 *
 * @param {String} adapterName имя адаптера
 *
 * @returns {DbAdapterInterface|undefined}
 */
DbManager.prototype.getAdapter = function getAdapter (adapterName)
{
    if (typeof adapterName !== 'string' || !adapterName.length)
        throw new error.DbManagerError('не удалось получить адаптер из DbManager.' +
            ' Имя адаптера не передано или представлено в недопустимом формате');

    return this._adapters[adapterName];
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
 * Удаление адаптера по имени
 *
 * @param {String} adapterName имя адаптера
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.removeAdapter = function removeAdapter (adapterName, cb)
{
    var self = this;

    if (typeof cb !== 'function') cb = function () {};

    if (typeof adapterName !== 'string' || !adapterName.length)
    {
        cb(new error.DbManagerError('не удалось удалить адаптер из DbManager.' +
            ' Имя адаптера не передано или представлено в недопустимом формате'), null);
        return self;
    }

    if (!(adapterName in self._adapters))
    {
        cb(null, null);
        return self;
    }

    self._adapters[adapterName].removeAllConnections(function (err)
    {
        if (err)
        {
            cb(err, null);
            return;
        }

        delete self._adapters[adapterName];

        cb(null, null);
    });

    return self;
};

/**
 * Удаление всех адаптеров
 *
 * @returns {DbManager}
 */
DbManager.prototype.removeAllAdapters = function removeAllAdapters (cb)
{
    var processing = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};

    for (var adapterName in this._adapters)
    {
        if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processing++;

        this.removeAdapter(adapterName, function (err)
        {
            if (err) errors.push(err);

            processing--;
        });
    }

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
                cb(errors.shift());
                return;
            }

            cb(null, null);
        });
    })();

    return this;
};

/**
 * Соединение с БД через адаптер по имени
 *
 * @param {String} adapterName имя адаптера
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.connect = function connect (adapterName, cb)
{
    if (typeof cb !== 'function') cb = function () {};

    if (typeof adapterName !== 'string' || !adapterName.length)
    {
        cb(new error.DbManagerError('не удалось установить соединение через адаптер в DbManager.' +
            ' Имя адаптера не передано или представлено в недопустимом формате'), null);
        return this;
    }

    if (!(adapterName in this._adapters))
    {
        cb(new error.MongoAdapterError('не удалось установить соединение через адаптер "' + adapterName + '"' +
            ' в DbManager. Адаптер не найден'), null);
        return this;
    }

    this._adapters[adapterName].connectAll(function (err)
    {
        if (err)
        {
            cb(err, null);
            return;
        }

        cb(null, null);
    });

    return this;
};

/**
 * Соединение с БД через все адаптеры
 *
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.connectAll = function connectAll (cb)
{
    var connecting = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};

    for (var adapterName in this._adapters)
    {
        if (!this._adapters.hasOwnProperty(adapterName)) continue;

        connecting++;

        this.connect(adapterName, function (err)
        {
            if (err) errors.push(err);

            connecting--;
        });
    }

    (function awaiting()
    {
        immediate(function ()
        {
            if (connecting)
            {
                awaiting();
                return;
            }

            if (errors.length)
            {
                cb(errors.shift());
                return;
            }

            cb(null, null);
        });
    })();

    return this;
};

/**
 * Разрыв соединений с БД адаптера по имени
 *
 * @param {String} adapterName имя адаптера
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.disconnect = function disconnect (adapterName, cb)
{
    if (typeof cb !== 'function') cb = function () {};

    if (typeof adapterName !== 'string' || !adapterName.length)
    {
        cb(new error.DbManagerError('не удалось разорвать соединения адаптера в DbManager.' +
            ' Имя адаптера не передано или представлено в недопустимом формате'), null);
        return this;
    }

    if (!(adapterName in this._adapters))
    {
        cb(new error.MongoAdapterError('не удалось разорвать соединения адаптера "' + adapterName + '"' +
            ' в DbManager. Адаптер не найден'), null);
        return this;
    }

    this._adapters[adapterName].disconnectAll(function (err)
    {
        if (err)
        {
            cb(err, null);
            return;
        }

        cb(null, null);
    });

    return this;
};

/**
 * Разрыв соединений с БД всех адаптеров
 *
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.disconnectAll = function disconnectAll (cb)
{
    var processing = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};

    for (var adapterName in this._adapters)
    {
        if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processing++;

        this.disconnect(adapterName, function (err)
        {
            if (err) errors.push(err);

            processing--;
        });
    }

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
                cb(errors.shift());
                return;
            }

            cb(null, null);
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

                err.log();

                return;
            }

            next();
        });
    };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbManager = DbManager;