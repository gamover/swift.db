/**
 * Created by G@mOBEP
 *
 * Date: 21.04.13
 * Time: 11:58
 */

var $util = require('util'),

    $swiftUtils = require('swift.utils'),
    typeUtil = $swiftUtils.type,

    DbError = require('../error').DbError;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbManagerError (message, details)
{
    DbError.call(this, message, details);
    Error.captureStackTrace(this, arguments.callee);

    this.name = 'swift.db:DbManagerError';
}
$util.inherits(DbManagerError, DbError);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbManagerError = DbManagerError;