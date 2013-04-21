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
 * Удаление соединения
 *
 * @param {String} connectionName имя соединения
 * @param {Function} cb
 *
 * @returns {DbAdapterInterface}
 */
DbAdapterInterface.prototype.removeConnection = function removeConnection (connectionName, cb)
{
    if (typeof cb !== 'function') cb = function () {};

    cb();

    return this;
};

/**
 * Удаление всех соединений соединения
 *
 * @param {Function} cb
 *
 * @returns {DbAdapterInterface}
 */
DbAdapterInterface.prototype.removeAllConnections = function removeAllConnections (cb)
{
    if (typeof cb !== 'function') cb = function () {};

    cb();

    return this;
};

/**
 * Подключение к БД через соединение по имени
 *
 * @param {String} connectionName имя соединения
 * @param {Function} cb
 *
 * @returns {DbAdapterInterface}
 */
DbAdapterInterface.prototype.connect = function connect (connectionName, cb)
{
    if (typeof cb !== 'function') cb = function () {};

    cb();

    return this;
};

/**
 * Подключение к БД через все соединения
 *
 * @param {Function} cb
 *
 * @returns {DbAdapterInterface}
 */
DbAdapterInterface.prototype.connectAll = function connectAll (cb)
{
    if (typeof cb !== 'function') cb = function () {};

    cb();

    return this;
};

/**
 * Разрыв соединения с БД по имени
 *
 * @param {String} connectionName имя соединения
 * @param {Function} cb
 *
 * @returns {DbAdapterInterface}
 */
DbAdapterInterface.prototype.disconnect = function disconnect (connectionName, cb)
{
    if (typeof cb !== 'function') cb = function () {};

    cb();

    return this;
};

/**
 * Разрыв всех соединений с БД
 *
 * @param {Function} cb
 *
 * @returns {DbAdapterInterface}
 */
DbAdapterInterface.prototype.disconnectAll = function disconnectAll (cb)
{
    if (typeof cb !== 'function') cb = function () {};

    cb();

    return this;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbAdapterInterface = DbAdapterInterface;