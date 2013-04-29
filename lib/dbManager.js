/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:24
 *
 * Менеджер баз данных Swift.
 */

var DbManagerError = require('./errors/dbManagerError').DbManagerError,
    DbAdapterInterface = require('./dbAdapters/dbAdapterInterface').DbAdapterInterface,
    MongoAdapter = null,

    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick;

try { MongoAdapter = require('./dbAdapters/mongoAdapter').MongoAdapter; }
catch(e){}

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
    if (typeof adapterName !== 'string' || !adapterName.length) throw new DbManagerError()
        .setMessage('Не удалось добавить адаптер. Имя адаптера не передано или представлено в недопустимом формате')
        .setCode(DbManagerError.codes.BAD_ADAPTER_NAME);
    if (adapterName in this._adapters) throw new DbManagerError()
        .setMessage('Не удалось добавить адаптер. Адаптер с именем "' + adapterName + '" уже существует')
        .setCode(DbManagerError.codes.ADAPTER_ALREADY_EXISTS);
    if (!(adapter instanceof DbAdapterInterface)) throw new DbManagerError()
        .setMessage('Не удалось добавить адаптер "' + adapterName + '". Адаптер не передан или представлен в недопустимом формате')
        .setCode(DbManagerError.codes.BAD_ADAPTER);

    this._adapters[adapterName] = adapter;

    return this;
};

/**
 * Получение адаптера
 *
 * @param {String} adapterName имя адаптера
 *
 * @returns {DbAdapterInterface|undefined}
 */
DbManager.prototype.getAdapter = function getAdapter (adapterName)
{
    if (typeof adapterName !== 'string' || !adapterName.length) throw new DbManagerError()
        .setMessage('Не удалось получить адаптер. Имя адаптера не передано или представлено в недопустимом формате')
        .setCode(DbManagerError.codes.BAD_ADAPTER_NAME);

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

    if (typeof adapterName !== 'string' || !adapterName.length)
    {
        cb(new DbManagerError()
            .setMessage('Не удалось удалить адаптер. Имя адаптера не передано или представлено в недопустимом формате')
            .setCode(DbManagerError.codes.BAD_ADAPTER_NAME));
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
            cb(new DbManagerError()
                .setMessage('Не удалось удалить адаптер "' + adapterName + '" (ответ адаптера: ' + err.message + ')')
                .setDetails(err)
                .setCode(DbManagerError.codes.SYSTEM_ERROR));
            return;
        }

        //
        // удаление адаптера из набора
        //

        delete self._adapters[adapterName];

        //
        ////
        //

        cb(null);
    });

    //
    ////
    //

    return this;
};

/**
 * Удаление всех адаптеров
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
    {
        if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processCount++;

        this.removeAdapter(adapterName, function (err)
        {
            if (err) errors.push(err);

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
                cb(new DbManagerError()
                    .setMessage('Во время удаления адаптеров произошли ошибки')
                    .setDetails(errors)
                    .setCode(DbManagerError.codes.SYSTEM_ERROR));
                return;
            }

            cb(null);
        });
    })();

    //
    ////
    //

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
    {
        if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processCount++;

        this.connectOne(adapterName, function (err)
        {
            if (err) errors = errors.concat(err);
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
                cb(errors);
                return;
            }

            cb(null);
        });
    })();

    //
    ////
    //

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
    var errors = [];

    if (typeof adapterName !== 'string' || !adapterName.length)
    {
        cb(new DbManagerError()
            .setMessage('Не удалось установить соединение. Имя адаптера не передано или представлено в недопустимом формате')
            .setCode(DbManagerError.codes.BAD_ADAPTER_NAME));
        return this;
    }

    if (!(adapterName in this._adapters))
    {
        cb(new DbManagerError()
            .setMessage('Не удалось установить соединение. Адаптер с именем "' + adapterName + '" не найден')
            .setCode(DbManagerError.codes.ADAPTER_NOT_FOUND));
        return this;
    }

    this._adapters[adapterName].connect(function (err)
    {
        if (err)
        {
            err.forEach(function (err)
            {
                errors.push(new DbManagerError()
                    .setMessage('Во время установления соединений через адаптер "' + adapterName + '" возникла ошибка (ответ адаптера: ' + err.message + ')')
                    .setDetails(err)
                    .setCode(DbManagerError.codes.SYSTEM_ERROR));
            });

            cb(errors);
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
    {
        if (!this._adapters.hasOwnProperty(adapterName)) continue;

        processing++;

        this.disconnectOne(adapterName, function (err)
        {
            if (err) errors.push(err);
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
                cb(errors);
                return;
            }

            cb(null);
        });
    })();

    //
    ////
    //

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
    if (typeof adapterName !== 'string' || !adapterName.length)
    {
        cb(new DbManagerError()
            .setMessage('Не удалось разорвать соединение. Имя адаптера не передано или представлено в недопустимом формате')
            .setCode(DbManagerError.codes.BAD_ADAPTER_NAME));
        return this;
    }

    if (!(adapterName in this._adapters))
    {
        cb(new DbManagerError()
            .setMessage('Не удалось разорвать соединение. Адаптер с именем "' + adapterName + '" не найден')
            .setCode(DbManagerError.codes.ADAPTER_NOT_FOUND));
        return this;
    }

    this._adapters[adapterName].disconnect(function (err)
    {
        if (err)
        {
            cb(new DbManagerError()
                .setMessage('Не удалось разорвать соединение через адаптер "' + adapterName + '" (ответ адаптера: ' + err.message + ')')
                .setDetails(err)
                .setCode(DbManagerError.codes.SYSTEM_ERROR));
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

                err.log();

                return;
            }

            next();
        });
    };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbManager = DbManager;