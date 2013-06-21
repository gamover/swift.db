/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:39
 */

var $util = require('util'),
    $events = require('events'),

    $swiftErrors = require('swift.errors'),
    $swiftUtils = require('swift.utils'),

    countAdapters = 0;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbAdapter ()
{
    countAdapters++;

    /**
     * Имя адаптера
     *
     * @type {String}
     * @private
     */
    this._name = 'dbAdapter' + countAdapters;
}
$util.inherits(DbAdapter, $events.EventEmitter);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Получение типа адаптера
 *
 * @returns {string}
 */
DbAdapter.prototype.getType = function getType ()
{
    return 'unknown';
};

/**
 * Задание имени адаптера
 *
 * @param {String} name
 *
 * @returns {DbAdapter}
 */
DbAdapter.prototype.setName = function setName (name)
{
    var error;

    if (typeof name !== 'string')
    {
        error = new $swiftErrors.TypeError('не удалось задать новое имя ' + this.getType() + '-адаптеру' +
            ' "' + this._name + '". Недопустимый тип имени адаптера');

        this.emit('error', error, 'setName');
        throw error;
    }
    if (!name.length)
    {
        error = new $swiftErrors.ValueError('не удалось задать имя ' + this.getType() + '-адаптеру' +
            ' "' + this._name + '". Не указано имя адаптера');

        this.emit('error', error, 'setName');
        throw error;
    }

    this._name = name;

    return this;
};

/**
 * Получение имени адаптера
 *
 * @returns {String}
 */
DbAdapter.prototype.getName = function getName ()
{
    return this._name;
};

/**
 * Установление соединения с БД
 *
 * @param {Function} cb
 *
 * @returns {DbAdapter}
 */
DbAdapter.prototype.connect = function connect (cb)
{
    if (typeof cb !== 'function')
    {
        cb = function(){};
    }

    cb();

    return this;
};

/**
 * Разрыв соединения с БД
 *
 * @param {Function} cb
 *
 * @returns {DbAdapter}
 */
DbAdapter.prototype.disconnect = function disconnect (cb)
{
    if (typeof cb !== 'function')
    {
        cb = function(){};
    }

    cb();

    return this;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbAdapter = DbAdapter;