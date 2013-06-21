/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 12:59
 */

var $util = require('util'),

    $swiftErrors = require('swift.errors'),
    $swiftUtils = require('swift.utils'),

    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick,

    DbAdapter = require('./dbAdapter').DbAdapter,
    MongoConnection = require('./mongoConnection').MongoConnection,

    adapterType = 'mongo',
    countAdapters = 0;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MongoAdapter ()
{DbAdapter.call(this);

    countAdapters++;

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
 * Получение типа адаптера
 *
 * @returns {String}
 */
MongoAdapter.prototype.getType = function getType ()
{
    return adapterType;
};

/**
 * Создание соединения
 *
 * @param {Object} params параметры соединения
 *
 * @returns {MongoConnection}
 */
MongoAdapter.prototype.createConnection = function createConnection (params)
{
    var self = this,
        connection = new MongoConnection().init(params),
        connectionName = connection.getName(),
        connectionSetNameFn = connection.setName,
        error;

    if (connectionName in this._connections)
    {
        error = new $swiftErrors.SystemError('не удалось создать mongo-соединение "' + connectionName + '"' +
            ' в адаптере "' + this._name + '". Соединение с именем "' + connectionName + '" уже создано');

        this.emit('error', error, 'createConnection');
        throw error;
    }
    //
    // перегрузка метода задания имени соединения
    //
    connection.setName = function setName (name)
    {
        var currentName = this._name;

        if (name === currentName) return this;

        if (name in self._connections)
        {
            error = new $swiftErrors.TypeError('не удалось задать имя "' + name + '" mongo-соединению "' + currentName + '".' +
                ' Соединение с именем "' + name + '" уже существует');

            this.emit('error', error, 'setName');
            throw error;
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
    // добавление соединения в набор
    //
    this._connections[connectionName] = connection;

    this.emit('createConnection', connection);

    return connection;
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
    if (typeof this._connections[connectionName] !== 'undefined')
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
    {if (!this._connections.hasOwnProperty(connectionName)) continue;
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
    var self = this,
        error;

    if (typeof cb !== 'function')
    {
        cb = function(){};
    }

    if (typeof connectionName !== 'string')
    {
        error = new $swiftErrors.SystemError('не удалось удалить соединение в адаптере "' + this._name + '".' +
            ' Недопустимый тип имени соединения');

        this.emit('error', error, 'removeConnection');
        cb(error);
        return this;
    }
    if (!connectionName.length)
    {
        error = new $swiftErrors.SystemError('не удалось удалить соединение в адаптере "' + this._name + '".' +
            ' Не указано имя соединения');

        this.emit('error', error, 'removeConnection');
        cb(error);
        return this;
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
            error = new $swiftErrors.SystemError('не удалось удалить соединение в адаптере "' + self._name + '"' +
                ' (' + err.message + ')')
                .setInfo(err);

            self.emit('error', error, 'removeConnection');
            cb(error);
            return;
        }
        //
        // удаление соединения
        //
        delete self._connections[connectionName];

        self.emit('removeConnection', connectionName);
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
    var self = this,
        processCount = 0,
        error,
        errors = [];

    if (typeof cb !== 'function')
    {
        cb = function(){};
    }

    for (var connectionName in this._connections)
    {if (!this._connections.hasOwnProperty(connectionName)) continue;
        processCount++;
        //
        // удаление соединения
        //
        this.removeConnection(connectionName, function (err)
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
                error = new $swiftErrors.MultipleError()
                    .setMessage('возникли ошибки при удалении соединений в mongo-адаптере "' + self._name + '"')
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
 * Установление соединений с БД
 *
 * @param {Function} cb
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.connect = function connect (cb)
{
    var self = this,
        processCount = 0,
        error,
        errors = [];

    if (typeof cb !== 'function')
    {
        cb = function(){};
    }

    for (var connectionName in this._connections)
    {if (!this._connections.hasOwnProperty(connectionName)) continue;
        processCount++;
        //
        // установление соединения
        //
        this._connections[connectionName].connect(function (err)
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
                error = new $swiftErrors.MultipleError()
                    .setMessage('возникли ошибки при установлении соединений в mongo-адаптере "' + self._name + '"')
                    .setList(errors);

                self.emit('error', error, 'connect');
                cb(error);
                return;
            }

            self.emit('connect', error);
            cb(null);
        });
    })();

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
        error,
        errors = [];

    if (typeof cb !== 'function')
    {
        cb = function(){};
    }

    for (var connectionName in this._connections)
    {if (!this._connections.hasOwnProperty(connectionName)) continue;
        processCount++;
        //
        // разрыв соединения
        //
        this._connections[connectionName].disconnect(function (err)
        {
            if (err)
            {
                errors.push(err);
            }

            processCount--;
        });
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
                error = new $swiftErrors.MultipleError()
                    .setMessage('возникли ошибки при разрыве соединений в mongo-адаптере "' + self._name + '"')
                    .setList(errors);

                self.emit('error', error, 'disconnect');
                cb(error);
                return;
            }

            self.emit('disconnect', error);
            cb(null);
        });
    })();

    return this;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapter = MongoAdapter;
exports.adapterType  = adapterType;