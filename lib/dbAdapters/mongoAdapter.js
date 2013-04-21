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
        throw new error.MongoAdapterError('не удалось добавить параметры соединения в MongoAdapter.' +
            ' Имя соединения не передано или представлено в недопустимом формате');
    if (connectionName in this._connectionsParams)
        throw new error.MongoAdapterError('не удалось добавить параметры соединения в MongoAdapter.' +
            ' Параметры соединения с именем "' + connectionName + '" уже существуют');
    if (!typeUtil.isObject(connectionParams))
        throw new error.MongoAdapterError('не удалось добавить параметры соединения "' + connectionName + '"' +
            'в MongoAdapter. Параметры соединения не переданы или представлены в недопустимом формате');

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
        throw new error.MongoAdapterError('не удалось получить параметры соединения из MongoAdapter.' +
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
        throw new error.MongoAdapterError('не удалось удалить параметры соединения из MongoAdapter.' +
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
        throw new error.MongoAdapterError('не удалось получить соединение из MongoAdapter.' +
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
        cb(new error.MongoAdapterError('не удалось удалить соединение из MongoAdapter.' +
            ' Имя соединения не передано или представлено в недопустимом формате'), null);
        return self;
    }

    if (!(connectionName in self._connections))
    {
        cb(null, null);
        return self;
    }

    self.disconnect(connectionName, function (err)
    {
        if (err)
        {
            cb(err, null);
            return;
        }

        delete self._connections[connectionName];

        cb(null, null);
    });

    return self;
};

/**
 * Удаление всех соединений
 *
 * @param {Function} cb
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.removeAllConnections = function removeAllConnections (cb)
{
    var self = this;

    if (typeof cb !== 'function') cb = function () {};

    self.disconnectAll(function (err)
    {
        if (err)
        {
            cb(err, null);
            return;
        }

        self._connections = {};

        cb(null, null);
    });

    return self;
};

/**
 * Установление соединения по имени
 *
 * @param {String} connectionName название соединения
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.connect = function connect (connectionName, cb)
{
    if (typeof cb !== 'function') cb = function () {};

    if (typeof connectionName !== 'string' || !connectionName.length)
    {
        cb(new error.MongoAdapterError('не удалось установить соединение в MongoAdapter.' +
            ' Имя соединения не передано или представлено в недопустимом формате'), null);
        return this;
    }

    if (!(connectionName in this._connectionsParams))
    {
        cb(new error.MongoAdapterError('не удалось установить соединение "' + connectionName + '" в MongoAdapter.' +
            ' Не найдены параметры соединения'), null);
        return this;
    }

    var connection = this._connections[connectionName],
        connectionParams = this._connectionsParams[connectionName];

    if (!this.isConnected(connectionName))
    {
        try
        {
            connection = this._connections[connectionName] = $mongoose.createConnection(connectionParams.uri);

            connection.on('error', function (err)
            {
                cb(new error.MongoAdapterError('в MongoAdapter произошли ошибки при установлении' +
                    ' сооединения "' + connectionName + '"', err));
            });

            connection.on('open', function ()
            {
                cb(null, null);
            });
        }
        catch (e)
        {
            cb(new error.MongoAdapterError('в MongoAdapter произошли ошибки при установлении' +
                ' сооединения "' + connectionName + '"', e));
        }

        return this;
    }

    cb(null, null);

    return this;
};

/**
 * Соединение
 *
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.connectAll = function connectAll (cb)
{
    var processCount = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};

    for (var connectionName in this._connectionsParams)
    {
        if (!this._connectionsParams.hasOwnProperty(connectionName)) continue;

        processCount++;

        this.connect(connectionName, function (err)
        {
            if (err) errors.push(err);

            processCount--;
        });
    }

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
                cb(errors.shift(), null);
                return;
            }

            cb(null, null);
        });
    })();

    return this;
};

/**
 * Разрыв соединения по имени
 *
 * @param {String} connectionName имя соединения
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.disconnect = function disconnect (connectionName, cb)
{
    if (typeof cb !== 'function') cb = function () {};

    if (typeof connectionName !== 'string' || !connectionName.length)
    {
        cb(new error.MongoAdapterError('не удалось разорвать соединение в MongoAdapter.' +
            ' Имя соединения не передано или представлено в недопустимом формате'), null);
        return this;
    }

    if (!(connectionName in this._connections))
    {
        cb(new error.MongoAdapterError('не удалось разорвать соединение "' + connectionName + '" в MongoAdapter.' +
            ' Соединение не найдено'), null);
        return this;
    }

    var connection = this._connections[connectionName];

    if (this.isConnected(connectionName))
    {
        try
        {
            connection.close(function (err)
            {
                if (err)
                {
                    cb(new error.MongoAdapterError('в MongoAdapter произошли ошибки при разрыве' +
                        ' сооединения "' + connectionName + '"', err));
                    return;
                }

                cb(null, null);
            });
        }
        catch (e)
        {
            cb(new error.MongoAdapterError('в MongoAdapter произошли ошибки при разрыве' +
                ' сооединения "' + connectionName + '"', e));
        }

        return this;
    }

    cb(null, null);

    return this;
};

/**
 * Разрыв всех соединений
 *
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.disconnectAll = function disconnectAll (cb)
{
    var processCount = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};

    for (var connectionName in this._connections)
    {
        if (!this._connections.hasOwnProperty(connectionName)) continue;

        processCount++;

        this.disconnect(connectionName, function (err)
        {
            if (err) errors.push(err);

            processCount--;
        });
    }

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
                cb(errors.shift(), null);
                return;
            }

            cb(null, null);
        });
    })();

    return this;
};

/**
 * Проверка наличия соединения
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {Boolean}
 */
MongoAdapter.prototype.isConnected = function (connectionName)
{
    if (typeof connectionName !== 'string' || !connectionName.length)
        throw new error.MongoAdapterError('не удалось проверить соединение в MongoAdapter.' +
            ' Имя соединения не передано или представлено в недопустимом формате');

    var connection = this._connections[connectionName];

    return (connection && (connection.readyState === 1 || connection.readyState === 2));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapter = MongoAdapter;