/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:39
 */

var $util = require('util'),

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

    /**
     * Тип адаптера
     *
     * @type {String}
     * @private
     */
    this._type = 'unknown';
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Получение типа адаптера
 *
 * @returns {String}
 */
DbAdapter.prototype.getType = function getType ()
{
    return this._type;
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