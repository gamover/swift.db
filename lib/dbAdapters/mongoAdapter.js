/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 12:59
 */

var $util = require('util'),

    $async = require('async'),

    $swiftErrors = require('swift.errors'),
    $swiftUtils = require('swift.utils'),

    DbAdapter = require('./dbAdapter').DbAdapter,
    MongoConnection = require('./mongoConnection').MongoConnection,

    adapterType = 'mongo',
    countAdapters = 0;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MongoAdapter ()
{DbAdapter.call(this);

    countAdapters++;

    /**
     * Тип адаптера
     *
     * @type {String}
     * @private
     */
    this._type = adapterType;

    /**
     * Имя адаптера
     *
     * @type {String}
     * @private
     */
    this._name = 'mongoAdapter' + countAdapters;

    /**
     * Соединения
     *
     * @type {Object}
     * @private
     */
    this._connections = {};
}
$util.inherits(MongoAdapter, DbAdapter);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Создание соединения
 *
 * @param {String} uri ссылка соединения
 * @param {String} name имя соединения
 *
 * @returns {MongoConnection}
 */
MongoAdapter.prototype.createConnection = function createConnection (uri, name)
{
    var connection = new MongoConnection().setUri(uri);

    if (name != null)
    {
        connection.setName(name);
    }
    //
    // добавление соединения
    //
    this.addConnection(connection);

    return connection;
};

/**
 * Добавление соединения
 *
 * @param {MongoConnection} connection
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.addConnection = function addConnection (connection)
{
    var self = this,
        connectionName = connection.getName(),
        connectionSetNameFn = connection.setName;

    if (connectionName in this._connections)
    {
        throw new $swiftErrors.SystemError('соединение с именем "' + connectionName + '" уже существует');
    }

    //
    // перегрузка метода задания имени соединения
    //
    connection.setName = function setName (name)
    {
        var currentName = this._name;

        if (name === currentName)
        {
            return this;
        }

        if (name in self._connections)
        {
            throw new $swiftErrors.ValueError('соединение с именем "' + name + '" уже существует');
        }

        connectionSetNameFn.call(this, name);
        //
        // обновление имени соединения в наборе
        //
        self._connections[name] = self._connections[currentName];
        delete self._connections[currentName];

        return this;
    };
    //
    // добавление соединения
    //
    this._connections[connectionName] = connection;

    return this;
};

/**
 * Получение mongoConnection
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {Object|null}
 */
MongoAdapter.prototype.getMongoConnection = function getMongoConnection (connectionName)
{
    return (this._connections[connectionName] || null);
};

/**
 * Получение всех mongoConnection
 *
 * @returns {Object}
 */
MongoAdapter.prototype.getAllMongoConnections = function getAllMongoConnections ()
{
    return this._connections;
};

/**
 * Получение соединения
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {Object|null}
 */
MongoAdapter.prototype.getConnection = function getConnection (connectionName)
{
    if (this._connections[connectionName])
    {
        return this._connections[connectionName].getConnection();
    }

    return null;
};

/**
 * Получение всех соединений
 *
 * @returns {Object}
 */
MongoAdapter.prototype.getAllConnections = function getAllConnections ()
{
    var connections = {};

    for (var connectionName in this._connections)
    {
        if (!this._connections.hasOwnProperty(connectionName))
        {
            continue;
        }

        connections[connectionName] = this._connections[connectionName].getConnection();
    }

    return connections;
};

/**
 * Удаление соединения
 *
 * @param {String} connectionName имя соединения
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.removeConnection = function removeConnection (connectionName, cb)
{
    var self = this;

    if (!cb)
    {
        cb = function(){};
    }

    if (!(connectionName in this._connections))
    {
        cb(null);
        return this;
    }
    //
    // разрыв соединения
    //
    this._connections[connectionName].disconnect(function (err)
    {
        if (err)
        {
            cb(err);
            return;
        }
        //
        // удаление соединения
        //
        delete self._connections[connectionName];

        cb(null);
    });

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
    var self = this;

    if (!cb)
    {
        cb = function(){};
    }
    //
    // удаление соединений
    //
    $async.each(this._connections, function (connectionName, stop)
    {
        self.removeConnection(connectionName, function (err)
        {
            stop(err);
        });
    }, function (err)
    {
        cb(err);
    });

    return this;
};

/**
 * Установление соединений с БД
 *
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.connect = function connect (cb)
{
    var self = this;

    if (!cb)
    {
        cb = function(){};
    }
    //
    // установление соединений
    //
    $async.each(this._connections, function (connectionName, stop)
    {
        self._connections[connectionName].connect(function (err)
        {
            stop(err);
        });
    }, function (err)
    {
        cb(err);
    });

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
    var self = this;

    if (typeof cb !== 'function')
    {
        cb = function(){};
    }
    //
    // разрыв соединений в адаптерах
    //
    $async.each(this._connections, function (connectionName, stop)
    {
        self._connections[connectionName].disconnect(function (err)
        {
            stop(err);
        });
    }, function (err)
    {
        cb(err);
    });

    return this;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapter = MongoAdapter;
exports.adapterType  = adapterType;