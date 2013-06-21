/**
 * Created by G@mOBEP
 *
 * Email:   rusmiran@gmail.com
 * Company: RealWeb
 * Date:    21.06.13
 * Time:    11:39
 */

var $util = require('util'),
    $events = require('events'),

    $swiftErrors = require('swift.errors'),
    $swiftUtils = require('swift.utils'),

    $mongoose = null,

    countConnections = 0;

try
{
    $mongoose = require('mongoose');
}
catch (err)
{
    if (err.code === 'MODULE_NOT_FOUND')
    {
        throw new $swiftErrors.SystemError('не найден модуль "mongoose" (npm i "mongoose" для установки)').setInfo(err);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MongoConnection ()
{
    countConnections++;

    /**
     * Имя соединения
     *
     * @type {String}
     * @private
     */
    this._name = 'mongoConnection' + countConnections;

    /**
     * uri
     *
     * @type {String}
     * @private
     */
    this._uri = null;

    /**
     * Соединение
     *
     * @type {Connection}
     * @private
     */
    this._connection = null;
}
$util.inherits(MongoConnection, $events.EventEmitter);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Задание имени соединения
 *
 * @param {String} name имя соединения
 *
 * @returns {MongoConnection}
 */
MongoConnection.prototype.setName = function setName (name)
{
    var error;

    if (typeof name !== 'string')
    {
        error = new $swiftErrors.TypeError('не удалось задать новое имя mongo-соединению "' + this._name + '".' +
            ' Недопустимый тип имени соединения');

        this.emit('error', error, 'setName');
        throw error;
    }
    if (!name.length)
    {
        error = new $swiftErrors.ValueError('не удалось задать новое имя mongo-соединению "' + this._name + '".' +
            ' Не указано имя соединения');

        this.emit('error', error, 'setName');
        throw error;
    }

    this._name = name;

    return this;
};

/**
 * Получение имени соединения
 *
 * @returns {String}
 */
MongoConnection.prototype.getName = function getName ()
{
    return this._name;
};

/**
 * Задание uri
 *
 * @param {String} uri
 *
 * @returns {MongoConnection}
 */
MongoConnection.prototype.setUri = function setUri (uri)
{
    var error;

    if (typeof uri !== 'string')
    {
        error = new $swiftErrors.TypeError('не удалось задать uri mongo-соединению "' + this._name + '".' +
            ' Недопустимый тип uri');

        this.emit('error', error, 'setUri');
        throw error;
    }
    if (!uri.length)
    {
        error = new $swiftErrors.ValueError('не удалось задать uri mongo-соединению "' + this._name + '".' +
            ' Не указан uri');

        this.emit('error', error, 'setUri');
        throw error;
    }

    uri = uri.split(',').map(function (suburi)
    {
        if (suburi.substr(0, 10) !== 'mongodb://')
        {
            return 'mongodb://' + suburi;
        }

        return suburi;
    }).join(',');

    this._uri = uri;

    return this;
};

/**
 * Получение uri
 *
 * @returns {String|null}
 */
MongoConnection.prototype.getUri = function getUri ()
{
    return this._uri;
};

/**
 * Инициализация соединения
 *
 * @param {Object} params параметры соединения:
 * {
 *     {String} name имя соединения
 *     {String} uri  uri соединения
 * }
 *
 * @returns {MongoConnection}
 */
MongoConnection.prototype.init = function init (params)
{
    var error;

    if (!$swiftUtils.type.isObject(params))
    {
        error = new $swiftErrors.ValueError('не удалось проинициализировать mongo-соединение "' + this._name + '".' +
            ' Недопустимый тип параметров соединения');

        this.emit('error', error, 'init');
        throw error;
    }

    if (typeof params.name !== 'undefined')
    {
        this.setName(params.name);
    }

    if (typeof params.uri !== 'undefined')
    {
        this.setUri(params.uri);
    }

    return this;
};

/**
 * Получение соединения
 *
 * @returns {Connection|null}
 */
MongoConnection.prototype.getConnection = function getConnection ()
{
    return this._connection;
};

/**
 * Установление соединения
 *
 * @param {Function} cb
 *
 * @returns {MongoConnection}
 */
MongoConnection.prototype.connect = function connect (cb)
{
    var self = this,
        error;

    if (typeof cb !== 'function')
    {
        cb = function(){};
    }

    if (this.isConnected())
    {
        cb(null, self._connection);
        return this;
    }

    if (this._uri === null)
    {
        error = new $swiftErrors.SystemError('не удалось установить mongo-соединение "' + this._name + '".' +
            ' Не задан uri');

        this.emit('error', error, 'connect');
        cb(error);
        return this;
    }

    try
    {
        //
        // установление соединения
        //
        this._connection = $mongoose.createConnection(this._uri);

        this._connection.on('error', function (err)
        {
            error = new $swiftErrors.SystemError('не удалось установить mongo-соединение "' + self._name + '"' +
                ' (mongoose: ' + err.message + ')')
                .setInfo(err);

            self.emit('error', error, 'connect');
            cb(error);
        });

        this._connection.on('open', function ()
        {
            self.emit('connect', self._connection);
            cb(null, self._connection);
        });

        this._connection.on('close', function ()
        {
            self._connection = null;
        });
    }
    catch (err)
    {
        error = new $swiftErrors.SystemError('не удалось установить mongo-соединение "' + this._name + '"' +
            ' (mongoose: ' + err.message + ')')
            .setInfo(err);

        this.emit('error', error, 'connect');
        cb(error);
    }

    return this;
};

/**
 * Разрыв соединения
 *
 * @param {Function} cb
 *
 * @returns {MongoConnection}
 */
MongoConnection.prototype.disconnect = function disconnect (cb)
{
    var self = this,
        error;

    if (typeof cb !== 'function')
    {
        cb = function(){};
    }

    if (!this.isConnected())
    {
        this._connection = null;

        cb(null);
        return this;
    }

    try
    {
        this._connection.close(function (err)
        {
            if (err)
            {
                error = new $swiftErrors.SystemError('не удалось разорвать mongo-соединение "' + self._name + '"' +
                    ' (mongoose: ' + err.message + ')')
                    .setInfo(err);

                self.emit('error', error, 'disconnect');
                cb(error);
                return;
            }

            self._connection = null;

            self.emit('disconnect');
            cb(null);
        });
    }
    catch (err)
    {
        error = new $swiftErrors.SystemError('не удалось разорвать mongo-соединение "' + this._name + '"' +
            ' (mongoose: ' + err.message + ')')
            .setInfo(err);

        this.emit('error', error, 'disconnect');
        cb(error);
    }

    return this;
};

/**
 * Проверка наличия соединения
 *
 * @returns {Boolean}
 */
MongoConnection.prototype.isConnected = function isConnected ()
{
    if (this._connection === null)
    {
        return false;
    }

    return (this._connection && (this._connection.readyState === 1 || this._connection.readyState === 2));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoConnection = MongoConnection;