/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 12:59
 */

var $mongoose = require('mongoose'),
    $util = require('util'),

    $swiftUtils = require('swift.utils'),
    typeUtil = $swiftUtils.type,

    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick,

    error = require('../error'),
    DbAdapterInterface = require('./dbAdapterInterface').DbAdapterInterface;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MongoAdapter ()
{
    /**
     * Параметры соединений
     *
     * @type {Object}
     * @private
     */
    this._connectionsParams = {};

    /**
     * Соединения
     *
     * @type {Object}
     * @private
     */
    this._connections = {};
}
$util.inherits(MongoAdapter, DbAdapterInterface);

/**
 * Добавление параметров соединения
 *
 * @param {String} connectionName имя соединения
 * @param {Object} connectionParams параметры соединения
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.addConectionParams = function addConectionParams (connectionName, connectionParams)
{
    if (typeof connectionName !== 'string' || !connectionName.length)
        throw new error.MongoAdapterError('Не удалось добавить параметры соединения.' +
            ' Имя соединения не передано или представлено в недопустимом формате');
    if (connectionName in this._connectionsParams)
        throw new error.MongoAdapterError('Не удалось добавить параметры соединения.' +
            ' Параметры соединения с именем "' + connectionName + '" уже существуют');
    if (!typeUtil.isObject(connectionParams))
        throw new error.MongoAdapterError('Не удалось добавить параметры соединения "' + connectionName + '".' +
            ' Параметры соединения не переданы или представлены в недопустимом формате');

    this._connectionsParams[connectionName] = connectionParams;

    return this;
};

/**
 * Получение параметров соединения по имени
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {Object|undefined}
 */
MongoAdapter.prototype.getConnectionParams = function getConnectionParams (connectionName)
{
    if (typeof connectionName !== 'string' || !connectionName.length)
        throw new error.MongoAdapterError('Не удалось получить параметры соединения.' +
            ' Имя соединения не передано или представлено в недопустимом формате');

    return this._connectionsParams[connectionName];
};

/**
 * Получение всех параметров соединений
 *
 * @returns {Object}
 */
MongoAdapter.prototype.getAllConnectionParams = function getAllConnectionParams ()
{
    return this._connectionsParams;
};

/**
 * Удаление параметров соединения по имени
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.removeConnectionParams = function removeConnectionParams (connectionName)
{
    if (typeof connectionName !== 'string' || !connectionName.length)
        throw new error.MongoAdapterError('Не удалось удалить параметры соединения.' +
            ' Имя соединения не передано или представлено в недопустимом формате');

    delete this._connectionsParams[connectionName];

    return this;
};

/**
 * Удаление всех параметров соединений
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.removeAllConnectionParams = function removeAllConnectionParams ()
{
    this._connectionsParams = {};

    return this;
};

/**
 * Получение соединения по имени
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {Object|undefined}
 */
MongoAdapter.prototype.getConnection = function getConnection (connectionName)
{
    if (typeof connectionName !== 'string' || !connectionName.length)
        throw new error.MongoAdapterError('Не удалось получить соединение.' +
            ' Имя соединения не передано или представлено в недопустимом формате');

    return this._connections[connectionName];
};

/**
 * Получение всех соединений
 *
 * @returns {Object}
 */
MongoAdapter.prototype.getAllConnections = function getAllConnections ()
{
    return this._connections;
};

/**
 * Удаление соединения по имени
 *
 * @param {String} connectionName имя соединения
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.removeConnection = function removeConnection (connectionName, cb)
{
    var self = this;

    if (typeof cb !== 'function') cb = function () {};

    if (typeof connectionName !== 'string' || !connectionName.length)
    {
        cb(new error.MongoAdapterError('Не удалось удалить соединение.' +
            ' Имя соединения не передано или представлено в недопустимом формате'));
        return this;
    }

    if (!(connectionName in this._connections))
    {
        cb(null);
        return this;
    }

    //
    // разрыв соединения с БД
    //

    this._connections[connectionName].close(function (err)
    {
        if (err)
        {
            cb(new error.MongoAdapterError('Не удалось удалить соединение "' + connectionName + '".', err));
            return;
        }

        //
        // удаление соединения
        //

        delete self._connections[connectionName];

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
 * Удаление всех соединений
 *
 * @param {Function} cb
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.removeAllConnections = function removeAllConnections (cb)
{
    var self = this,
        processCount = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};

    //
    // удаление соединений
    //

    for (var connectionName in this._connections)
    {
        if (!this._connections.hasOwnProperty(connectionName)) continue;

        processCount++;

        self.removeConnection(connectionName, function (err)
        {
            if (err) errors.push(err);

            processCount--;
        });
    }

    //
    // ожидание завершения удаления соединений
    //

    (function awaiting ()
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
                cb(new error.MongoAdapterError('Во время удаления соединений возникли ошибки', errors));
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
 * Установление соединений с БД (все соединения адаптера)
 *
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.connect = function connect (cb)
{
    var self = this,
        processCount = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};

    //
    // установление соединений
    //

    for (var connectionName in this._connectionsParams)
    {
        if (!this._connectionsParams.hasOwnProperty(connectionName)) continue;

        (function (connectionName)
        {
            if (!self.isConnected(connectionName))
            {
                processCount++;

                MongoAdapter.connect(self._connectionsParams[connectionName], function (err, connection)
                {
                    if (err)
                    {
                        errors.push(new error.MongoAdapterError('Произошла ошибка при установлении' +
                            ' сооединения "' + connectionName + '"', err));
                        processCount--;
                        return;
                    }

                    self._connections[connectionName] = connection;
                    processCount--;
                });
            }
        })(connectionName);
    }

    //
    // ожидание завершения установления соединений
    //

    (function awaiting ()
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
                cb(new error.MongoAdapterError('Во время установления соединений произошли ошибки', errors));
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
 * Разрыв соединений с БД (все соединения адаптера)
 *
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.disconnect = function disconnect (cb)
{
    var self = this,
        processCount = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};

    //
    // разрыв соединений
    //

    for (var connectionName in this._connections)
    {
        if (!this._connections.hasOwnProperty(connectionName)) continue;

        (function (connectionName)
        {
            if (self.isConnected(connectionName))
            {
                processCount++;

                try
                {
                    self._connections[connectionName].close(function (err)
                    {
                        if (err) errors.push(new error.MongoAdapterError('Произошла ошибка при разрыве' +
                            ' сооединения "' + connectionName + '"', err));

                        processCount--;
                    });
                }
                catch (e)
                {
                    cb(new error.MongoAdapterError('Произошла ошибка при разрыве' +
                        ' сооединения "' + connectionName + '"', e));
                    processCount--;
                }
            }
        })(connectionName);
    }

    //
    // ожидание завершения разрыва соединений
    //

    (function awaiting ()
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
                cb('Во время разрыва соединений произошли ошибки', errors);
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
 * Проверка наличия соединения
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {Boolean}
 */
MongoAdapter.prototype.isConnected = function isConnected (connectionName)
{
    if (typeof connectionName !== 'string' || !connectionName.length)
        throw new error.MongoAdapterError('не удалось проверить соединение.' +
            ' Имя соединения не передано или представлено в недопустимом формате');

    var connection = this._connections[connectionName];

    return (connection && (connection.readyState === 1 || connection.readyState === 2));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// static
//

/**
 * Установление соединения с БД
 *
 * @param {Object} connectionParams параметры соединения
 *
 * @param {Function} cb
 */
MongoAdapter.connect = function connect (connectionParams, cb)
{
    try
    {
        var connection = $mongoose.createConnection(connectionParams.uri);

        connection.on('error', function (err) { cb(err, null); });
        connection.on('open', function () { cb(null, connection); });
    }
    catch (e) { cb(e, null); }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapter = MongoAdapter;