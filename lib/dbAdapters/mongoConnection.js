/**
 * Created by G@mOBEP
 *
 * Email:   rusmiran@gmail.com
 * Company: RealWeb
 * Date:    21.06.13
 * Time:    11:39
 */

var $util = require('util'),

    $mongoose = require('mongoose'),

    $swiftUtils = require('swift.utils'),

    countConnections = 0;

try
{
    $mongoose = require('mongoose');
}
catch (err)
{
    if (err.code === 'MODULE_NOT_FOUND')
    {
        throw err;
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
    this._uri = uri.split(',').map(function (suburi)
    {
        if (suburi.substr(0, 10) !== 'mongodb://')
        {
            return 'mongodb://' + suburi;
        }

        return suburi;
    }).join(',');

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
    var self = this;

    if (!cb)
    {
        cb = function(){};
    }

    if (this.isConnected())
    {
        cb(null, self._connection);
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
            cb(err);
        });

        this._connection.on('open', function ()
        {
            cb(null, self._connection);
        });

        this._connection.on('close', function ()
        {
            self._connection = null;
        });
    }
    catch (err)
    {
        cb(err);
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
    var self = this;

    if (!cb)
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
                cb(err);
                return;
            }

            self._connection = null;

            cb(null);
        });
    }
    catch (err)
    {
        cb(err);
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
    return (this._connection && (this._connection.readyState === 1 || this._connection.readyState === 2));
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoConnection = MongoConnection;