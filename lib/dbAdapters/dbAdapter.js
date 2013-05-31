/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:39
 */

var $swiftErrors = require('swift.errors'),
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
    this._name = 'dbAdapter_' + countAdapters;
}

/**
 * Задание имени адаптера
 *
 * @param {String} name
 *
 * @returns {DbAdapter}
 */
DbAdapter.prototype.setName = function setName (name)
{
    //
    // проверка параметров
    //
    if (typeof name !== 'string')
        throw new $swiftErrors.TypeError('не изменить имя адаптеру "' + this._name + '". Недопустимый тип имени адаптера (ожидается: "string", принято: "' + typeof name + '")');
    if (!name.length)
        throw new $swiftErrors.ValueError('не изменить имя адаптеру "' + this._name + '". Пустое значение имени адаптера');
    //
    // задание имени адаптера
    //
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
    if (typeof cb !== 'function') cb = function(){};
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
    if (typeof cb !== 'function') cb = function(){};
    cb();
    return this;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbAdapter = DbAdapter;