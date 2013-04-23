/**
 * Created by G@mOBEP
 *
 * Date: 21.04.13
 * Time: 11:58
 */

var $util = require('util'),

    DbError = require('../error').DbError;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbManagerError (message, details)
{
    DbError.call(this, 'DbManager: ' + message, details);
    Error.captureStackTrace(this, arguments.callee);

    this.name = 'swift.db:DbManagerError';
}
$util.inherits(DbManagerError, DbError);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbManagerError = DbManagerError;