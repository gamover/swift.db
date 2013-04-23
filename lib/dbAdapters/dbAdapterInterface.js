/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:39
 */

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbAdapterInterface () {}

/**
 * Установление соединения с БД
 *
 * @param {Function} cb
 *
 * @returns {DbAdapterInterface}
 */
DbAdapterInterface.prototype.connect = function connect (cb)
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
 * @returns {DbAdapterInterface}
 */
DbAdapterInterface.prototype.disconnect = function disconnect (cb)
{
    if (typeof cb !== 'function') cb = function(){};
    cb();
    return this;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbAdapterInterface = DbAdapterInterface;