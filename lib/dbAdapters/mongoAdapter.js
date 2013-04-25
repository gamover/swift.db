/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 12:59
 */

var $util = require('util'),

    $swiftUtils = require('swift.utils'),
    $mongoose = null,

    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick,

    MongoAdapterError = require('../error').MongoAdapterError,
    DbAdapterInterface = require('./dbAdapterInterface').DbAdapterInterface;

try { $mongoose = require('mongoose'); }
catch (e)
{
    if (e.code === 'MODULE_NOT_FOUND') throw new MongoAdapterError()
        .setMessage('Не найден модуль "mongoose". npm i "mongoose" для установки')
        .setDetails(e)
        .setCode(MongoAdapterError.codes.MONGOOSE_NOT_FOUND);
}

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
        throw new MongoAdapterError()
            .setMessage('Не удалось добавить параметры соединения. Имя соединения не передано или представлено в недопустимом формате')
            .setCode(MongoAdapterError.codes.BAD_INPUT_DATA);
    if (connectionName in this._connectionsParams)
        throw new MongoAdapterError()
            .setMessage('Не удалось добавить параметры соединения. Параметры соединения с именем "' + connectionName + '" уже существуют')
            .setCode(MongoAdapterError.codes.CONNECTION_ALREADY_EXISTS);
    if (!$swiftUtils.type.isObject(connectionParams))
        throw new MongoAdapterError()
            .setMessage('Не удалось добавить параметры соединения "' + connectionName + '". Параметры соединения не переданы или представлены в недопустимом формате')
            .setCode(MongoAdapterError.codes.BAD_INPUT_DATA);

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
        throw new MongoAdapterError()
            .setMessage('Не удалось получить параметры соединения. Имя соединения не передано или представлено в недопустимом формате')
            .setCode(MongoAdapterError.codes.BAD_INPUT_DATA);

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
        throw new MongoAdapterError()
            .setMessage('Не удалось удалить параметры соединения. Имя соединения не передано или представлено в недопустимом формате')
            .setCode(MongoAdapterError.codes.BAD_INPUT_DATA);

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
        throw new MongoAdapterError()
            .setMessage('Не удалось получить соединение. Имя соединения не передано или представлено в недопустимом формате')
            .setCode(MongoAdapterError.codes.BAD_INPUT_DATA);

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
        cb(new MongoAdapterError())
            .setMessage('Не удалось удалить соединение. Имя соединения не передано или представлено в недопустимом формате')
            .setCode(MongoAdapterError.codes.BAD_INPUT_DATA);
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
            cb(new MongoAdapterError()
                .setMessage('Не удалось удалить соединение "' + connectionName + '" (ответ mongoose: ' + err.message + ')')
                .setDetails(err)
                .setCode(MongoAdapterError.codes.REMOVE_CONNECTION_ERROR));
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
                cb(new MongoAdapterError()
                    .setMessage('Во время удаления соединений возникли ошибки')
                    .setDetails(errors)
                    .setCode(MongoAdapterError.codes.REMOVE_CONNECTION_ERROR));
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
            processCount++;

            self.connectOne(connectionName, function (err)
            {
                if (err) errors.push(err);
                processCount--;
            });
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
 * Установление соединения с БД
 *
 * @param {String} connectionName имя соединения
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.connectOne = function connectOne (connectionName, cb)
{
    var self = this;

    if (typeof cb !== 'function') cb = function () {};

    if (typeof connectionName !== 'string' || !connectionName.length)
    {
        cb(new MongoAdapterError())
            .setMessage('Не удалось установить соединение. Имя соединения не передано или представлено в недопустимом формате')
            .setCode(MongoAdapterError.codes.BAD_INPUT_DATA);
        return this;
    }

    if (!(connectionName in this._connectionsParams))
    {
        cb(new MongoAdapterError())
            .setMessage('Не удалось установить соединение "' + connectionName + '". Не найдены параметры соединения')
            .setCode(MongoAdapterError.codes.CONNECTION_PARAMS_NOT_FOUND);
        return this;
    }

    //
    // установление соединения
    //

    if (!this.isConnected(connectionName))
    {
        MongoAdapter.connect(this._connectionsParams[connectionName], function (err, connection)
        {
            if (err)
            {
                cb(new MongoAdapterError()
                    .setMessage('Произошла ошибка при установлении сооединения "' + connectionName + '" (ответ mongoose: ' + err.message + ')')
                    .setDetails(err)
                    .setCode(MongoAdapterError.codes.CONNECT_ERROR));
                return;
            }

            self._connections[connectionName] = connection;
            cb(null);
        });

        return this;
    }

    cb(null);

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
            processCount++;

            self.disconnect(connectionName, function (err)
            {
                if (err) errors.push(err);
                processCount--;
            });
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
 * Разрыв соединения с БД
 *
 * @param {String} connectionName имя соединения
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.disconnectOne = function disconnectOne (connectionName, cb)
{
    if (typeof cb !== 'function') cb = function () {};

    if (typeof connectionName !== 'string' || !connectionName.length)
    {
        cb(new MongoAdapterError())
            .setMessage('Не удалось разорвать соединение. Имя соединения не передано или представлено в недопустимом формате')
            .setCode(MongoAdapterError.codes.BAD_INPUT_DATA);
        return this;
    }

    if (!(connectionName in this._connections))
    {
        cb(new MongoAdapterError())
            .setMessage('Не удалось разорвать соединение "' + connectionName + '". Соединение не найдено')
            .setCode(MongoAdapterError.codes.CONNECTION_NOT_FOUND);
        return this;
    }

    //
    // Разрыв соединения
    //

    if (this.isConnected(connectionName))
    {
        MongoAdapter.disconnect(this._connections[connectionName], function (err)
        {
            if (err)
            {
                cb(new MongoAdapterError()
                    .setMessage('Произошла ошибка при разрыве сооединения "' + connectionName + '" (ответ mongoose: ' + err.message + ')')
                    .setDetails(err)
                    .setCode(MongoAdapterError.codes.DISCONNECT_ERROR));
                return;
            }

            cb(null);
        });

        return this;
    }

    cb(null);

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
        throw new MongoAdapterError()
            .setMessage('не удалось проверить соединение. Имя соединения не передано или представлено в недопустимом формате')
            .setCode(MongoAdapterError.codes.BAD_INPUT_DATA);

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

/**
 * Разрыв соединения с БД
 *
 * @param {Object} connection соединение
 * @param {Function} cb
 */
MongoAdapter.disconnect = function disconnect (connection, cb)
{
    try { connection.close(function (err) { cb (err || null); }); }
    catch (e) { cb(e); }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapter = MongoAdapter;