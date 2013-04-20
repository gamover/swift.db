/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 12:59
 */

var $mongoose = require('mongoose'),
    $util = require('util'),

    nextTick = typeof setImmediate === 'function' ? setImmediate : process.nextTick,

    DbAdapter = require('./dbAdapter').DbAdapter;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports = module.exports = MongoAdapter;

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
$util.inherits(MongoAdapter, DbAdapter);

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
    this._connectionsParams[connectionName] = connectionParams;

    return this;
};

/**
 * Получение параметров соединений
 *
 * @returns {Object}
 */
MongoAdapter.prototype.getConnectionsParams = function getConnectionsParams ()
{
    return this._connectionsParams;
};

/**
 * Получение соединений
 *
 * @returns {Object}
 */
MongoAdapter.prototype.getConnections = function getConnections ()
{
    return this._connections;
};

/**
 * Получение соединения
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {Object}
 */
MongoAdapter.prototype.getConnection = function getConnection (connectionName)
{
    return this._connections[connectionName];
};

/**
 * Соединение
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

    Object.keys(self._connectionsParams).forEach(function (connectionName)
    {
        var connection = self._connections[connectionName],
            connectionExists = connection && (connection.readyState === 1 || connection.readyState === 2);

        if (!connectionExists)
        {
            processCount++;

            var connectionParams = self._connectionsParams[connectionName];

            try
            {
                connection = self._connections[connectionName] = $mongoose.createConnection(connectionParams.uri);

                connection.on('error', function (err)
                {
                    errors.push(['во время установки соединения "' + connectionName + '" возникли ошибки', err]);
                    processCount--;
                });

                connection.on('open', function ()
                {
                    processCount--;
                });
            }
            catch (e)
            {
                errors.push(['во время установки соединения "' + connectionName + '" возникли ошибки', e]);

                processCount--;
            }
        }
    });

    (function awaiting ()
    {
        nextTick(function ()
        {
            if (processCount)
            {
                awaiting();
                return;
            }

            cb(errors.length ? errors : null);
        });
    })();

    return self;
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
    var connection = self._connections[connectionName];

    return (connection && (connection.readyState === 1 || connection.readyState === 2));
};