/**
 * Created by G@mOBEP
 *
 * Date: 21.04.13
 * Time: 11:37
 */

var $util = require('util')/*,

    $swiftUtils = require('swift.utils'),
    typeUtil = $swiftUtils.type*/;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbError (message, details)
{
//    var self = this;

    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);

    this.name    = 'swift.db:DbError';
    this.message = 'swift.db ' + message;
    this.details = details || '';
    this.code    = 'ERROR';

//    if (this.details)
//    {
//        this.trace = [];
//        trace(this.details);
//    }
//
//    function trace (error)
//    {
//        if (!error) return;
//
//        if (typeUtil.isArray(error))
//        {
//            error.forEach(function (error) { trace(error); });
//            return;
//        }
//
//        if (error instanceof DbError)
//        {
//            self.trace.push(error.message);
//            trace(error.details);
//        }
//        else if (typeUtil.isError(error)) self.trace.push(error.toString());
//        else self.trace.push(JSON.stringify(error))
//    }
}
$util.inherits(DbError, Error);

/**
 * Задание сообщения об ошибке
 *
 * @param {String} message сообщение об ошибке
 *
 * @returns {DbError}
 */
DbError.prototype.setMessage = function setMessage (message)
{
    this.message = message;
    return this;
};

/**
 * Задание деталей
 *
 * @param {*} details детали
 *
 * @returns {DbError}
 */
DbError.prototype.setDetails = function setMessage (details)
{
    this.details = details;
    return this;
};

/**
 * Задание кода ошибки
 *
 * @param {String} code код ошибки
 *
 * @returns {DbError}
 */
DbError.prototype.setCode = function setCode (code)
{
    this.code = code;
    return this;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbError           = DbError;
exports.DbManagerError    = require('./errors/dbManagerError').DbManagerError;
exports.MongoAdapterError = require('./errors/mongoAdapterError').MongoAdapterError;