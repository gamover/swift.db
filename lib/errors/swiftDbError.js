/**
 * Created by G@mOBEP
 *
 * Date: 21.04.13
 * Time: 11:37
 */

var $util = require('util');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function SwiftDbError (message, details)
{
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);

    this.name    = 'SwiftDbError';
    this.message = 'swift.db ' + message;
    this.details = details || null;
    this.code    = null;
}
$util.inherits(SwiftDbError, Error);

/**
 * Задание сообщения об ошибке
 *
 * @param {String} message сообщение об ошибке
 *
 * @returns {SwiftDbError}
 */
SwiftDbError.prototype.setMessage = function setMessage (message)
{
    this.message = message;
    return this;
};

/**
 * Задание деталей
 *
 * @param {*} details детали
 *
 * @returns {SwiftDbError}
 */
SwiftDbError.prototype.setDetails = function setMessage (details)
{
    this.details = details;
    return this;
};

/**
 * Задание кода ошибки
 *
 * @param {String} code код ошибки
 *
 * @returns {SwiftDbError}
 */
SwiftDbError.prototype.setCode = function setCode (code)
{
    this.code = code;
    return this;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.SwiftDbError      = SwiftDbError;
exports.DbManagerError    = require('./dbManagerError').DbManagerError;
exports.MongoAdapterError = require('./mongoAdapterError').MongoAdapterError;