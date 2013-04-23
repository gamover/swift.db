/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:24
 *
 * Менеджер баз данных Swift.
 */

var error = require('./error'),
    DbAdapterInterface = require('./dbAdapters/dbAdapterInterface').DbAdapterInterface,
    MongoAdapter = require('./dbAdapters/mongoAdapter').MongoAdapter,

    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick;

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
        throw new error.DbManagerError('Не удалось добавить адаптер.' +
            ' Имя адаптера не передано или представлено в недопустимом формате');
    if (adapterName in this._adapters)
        throw new error.DbManagerError('Не удалось добавить адаптер.' +
            ' Адаптер с именем "' + adapterName + '" уже существует');
    if (!(adapter instanceof DbAdapterInterface))
        throw new error.DbManagerError('Не удалось добавить адаптер "' + adapterName + '".' +
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
        throw new error.DbManagerError('Не удалось получить адаптер.' +
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
        cb(new error.DbManagerError('Не удалось удалить адаптер.' +
            ' Имя адаптера не передано или представлено в недопустимом формате'));
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
            cb(new error.DbManagerError('Не удалось удалить адаптер "' + adapterName + '"', err));
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
                cb(new error.DbManagerError('Во время удаления адаптеров произошли ошибки', errors));
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
 * Установление соединений с БД
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

        this._adapters[adapterName].connect(function (err)
        {
            if (err) errors.push(err);

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
                cb(new error.DbManagerError('Во время установления соединений в адаптерах произошли ошибки', errors));
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
 * Разрыв соединений с БД
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

        this._adapters[adapterName].disconnect(function (err)
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
                cb(new error.DbManagerError('Во время разрыва соединений в адаптерах произошли ошибки', errors));
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