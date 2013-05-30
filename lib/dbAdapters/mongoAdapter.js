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
    $mongoose = null,

    immediate = typeof setImmediate === 'function' ? setImmediate : process.nextTick,

    DbAdapter = require('./dbAdapter').DbAdapter,

    countAdapters = 0;

try { $mongoose = require('mongoose'); }
catch (err)
{
    if (err.code === 'MODULE_NOT_FOUND')
        throw new $swiftErrors.SystemError('Не найден модуль "mongoose" (npm i "mongoose" для установки).').setInfo(err);
}

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
    this._name = 'mongoAdapter_' + countAdapters;

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
 * @param {Object} connectionsParams параметры соединения
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.setConnectionsParams = function setConnectionsParams (connectionsParams)
{
    //
    // проверка параметров
    //
    if (!$swiftUtils.type.isObject(connectionsParams))
        throw new $swiftErrors.TypeError('MongoAdapter[' + this._name + ']: недопустимый тип параметров соединения (ожидается: "object", принято: "' + typeof connectionsParams + '")');
    //
    // задание параметров соединений
    //
    this._connectionsParams = connectionsParams;

    return this;
};

/**
 * Добавление параметров соединения
 *
 * @param {String} connectionName имя соединения
 * @param {Object} connectionParams параметры соединения
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.addConnectionParams = function addConnectionParams (connectionName, connectionParams)
{
    //
    // проверка параметров
    //
    if (typeof connectionName !== 'string')
        throw new $swiftErrors.TypeError('MongoAdapter[' + this._name + ']: недопустимый тип имени соединения (ожидается: "string", принято: "' + typeof connectionName + '")');
    if (!connectionName.length)
        throw new $swiftErrors.ValueError('MongoAdapter[' + this._name + ']: пустое значение имени соединения');
    if (connectionName in this._connectionsParams)
        throw new $swiftErrors.SystemError('MongoAdapter[' + this._name + ']: параметры соединения "' + connectionName + '" уже существуют');
    if (!$swiftUtils.type.isObject(connectionParams))
        throw new $swiftErrors.TypeError('MongoAdapter[' + this._name + ']: недопустимый тип параметров соединения (ожидается: "object", принято: "' + typeof connectionParams + '")');
    //
    // добавление параметров соединения
    //
    this._connectionsParams[connectionName] = connectionParams;

    return this;
};

/**
 * Получение параметров соединения
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {Object|null}
 */
MongoAdapter.prototype.getConnectionParams = function getConnectionParams (connectionName)
{
    return (this._connectionsParams[connectionName] || null);
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
 * Удаление параметров соединения
 *
 * @param {String} connectionName имя соединения
 *
 * @returns {MongoAdapter}
 */
MongoAdapter.prototype.removeConnectionParams = function removeConnectionParams (connectionName)
{
    //
    // проверка параметров
    //
    if (typeof connectionName !== 'string')
        throw new $swiftErrors.TypeError('MongoAdapter[' + this._name + ']: недопустимый тип имени соединения (ожидается: "string", принято: "' + typeof connectionName + '")');
    if (!connectionName.length)
        throw new $swiftErrors.ValueError('MongoAdapter[' + this._name + ']: пустое значение имени соединения');
    //
    // удаление параметров соединения
    //
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
 * @returns {Object|null}
 */
MongoAdapter.prototype.getConnection = function getConnection (connectionName)
{
    return (this._connections[connectionName] || null);
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
    //
    // проверка параметров
    //
    if (typeof connectionName !== 'string')
    {
        cb(new $swiftErrors.TypeError('MongoAdapter[' + this._name + ']: недопустимый тип имени соединения (ожидается: "string", принято: "' + typeof connectionName+ '")'));
        return this;
    }
    if (!connectionName.length)
    {
        cb(new $swiftErrors.ValueError('MongoAdapter[' + this._name + ']: пустое значение имени соединения адаптера "' + this._name + '"'));
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
            if (err instanceof $swiftErrors.MultipleError)
                cb(new $swiftErrors.MultipleError('MongoAdapter[' + self._name + ']: ошибки разрыва соединения "' + connectionName + '" с БД').setList(err.list).setInfo(err));
            else
                cb(new $swiftErrors.SystemError('MongoAdapter[' + self._name + ']: ошибка разрыва соединения "' + connectionName + '" с БД (' + err.message + ')').setInfo(err));

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
    var self = this,
        processCount = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};
    //
    // удаление соединений
    //
    for (var connectionName in this._connections)
    {if (!this._connections.hasOwnProperty(connectionName)) continue;

        processCount++;

        self.removeConnection(connectionName, function (err)
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
                cb(new $swiftErrors.MultipleError('MongoAdapter[' + self._name + ']: ошибки удаления соединений').setList(errors));
                return;
            }

            cb(null);
        });
    })();

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
    var processCount = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};
    //
    // установление соединений
    //
    for (var connectionName in this._connectionsParams)
    {if (!this._connectionsParams.hasOwnProperty(connectionName)) continue;

        processCount++;

        this.connectOne(connectionName, function (err)
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
                cb(new $swiftErrors.MultipleError('MongoAdapter[' + self._name + ']: ошибки установления соединений').setList(errors));
                return;
            }

            cb(null);
        });
    })();

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
    //
    // проверка параметров
    //
    if (typeof connectionName !== 'string')
    {
        cb(new $swiftErrors.TypeError('MongoAdapter[' + this._name + ']: недопустимый тип имени сооединения (ожидается: "string", принято: "' + typeof connectionName + '")'));
        return this;
    }
    if (!connectionName.length)
    {
        cb(new $swiftErrors.ValueError('MongoAdapter[' + this._name + ']: пустое значение имени сооединения'));
        return this;
    }
    if (!(connectionName in this._connectionsParams))
    {
        cb(new $swiftErrors.SystemError('MongoAdapter[' + this._name + ']: соединение с именем "' + connectionName + '" не найдено'));
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
                if (err instanceof $swiftErrors.MultipleError)
                    cb(new $swiftErrors.MultipleError('MongoAdapter[' + self._name + ']: ошибки установления соединения "' + connectionName + '" с БД').setList(err.list).setInfo(err));
                else
                    cb(new $swiftErrors.SystemError('MongoAdapter[' + self._name + ']: ошибка установления соединения "' + connectionName + '" с БД (' + err.message + ')').setInfo(err));

                return;
            }

            self._connections[connectionName] = connection;
            cb(null);
        });
    }
    else cb(null);

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
    var processCount = 0,
        errors = [];

    if (typeof cb !== 'function') cb = function () {};
    //
    // разрыв соединений
    //
    for (var connectionName in this._connections)
    {if (!this._connections.hasOwnProperty(connectionName)) continue;

        processCount++;

        this.disconnect(connectionName, function (err)
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
                cb(new $swiftErrors.MultipleError('MongoAdapter[' + self._name + ']: ошибки разрыва соединений').setList(errors));
                return;
            }

            cb(null);
        });
    })();

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
    //
    // проверка параметров
    //
    if (typeof connectionName !== 'string')
    {
        cb(new $swiftErrors.TypeError('MongoAdapter[' + this._name + ']: недопустимый тип имени сооединения (ожидается: "string", принято: "' + typeof connectionName+ '")'));
        return this;
    }
    if (!connectionName.length)
    {
        cb(new $swiftErrors.ValueError('MongoAdapter[' + this._name + ']: путстое значение имени сооединения'));
        return this;
    }
    if (!(connectionName in this._connections))
    {
        cb(new $swiftErrors.SystemError('MongoAdapter[' + this._name + ']: соединение с именем "' + connectionName + '" не найдено'));
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
                if (err instanceof $swiftErrors.MultipleError)
                    cb(new $swiftErrors.MultipleError('MongoAdapter[' + self._name + ']: ошибки разрыва соединения "' + connectionName + '" с БД').setList(err.list).setInfo(err));
                else
                    cb(new $swiftErrors.SystemError('MongoAdapter[' + self._name + ']: ошибка разрыва соединения "' + connectionName + '" с БД (' + err.message + ')').setInfo(err));

                return;
            }

            cb(null);
        });
    }
    else cb(null);

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
    //
    // проверка параметров
    //
    if (typeof connectionName !== 'string')
        throw new $swiftErrors.TypeError('MongoAdapter[' + this._name + ']: недопустимый тип имени соединения (ожидается: "string", принято: "' + typeof connectionName + '")');
    if (!connectionName.length)
        throw new $swiftErrors.ValueError('MongoAdapter[' + this._name + ']: недопустимое значение имени соединения');
    //
    // получение соединения
    //
    var connection = this._connections[connectionName];
    //
    // проверка соединения
    //
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
    catch (err)
    {
        cb(new $swiftErrors.SystemError('MongoAdapter: ошибка установления соединения с БД (' + err.message + ')').setInfo(err));
    }
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
    catch (err)
    {
        cb(new $swiftErrors.SystemError('MongoAdapter[' + this._name + ']: ошибка разрыва соединения с БД (' + err.message + ')').setInfo(err));
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapter = MongoAdapter;