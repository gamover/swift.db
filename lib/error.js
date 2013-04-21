/**
 * Created by G@mOBEP
 *
 * Date: 21.04.13
 * Time: 11:37
 */

var $util = require('util');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbError (message, details)
{
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);

    this.name = 'swift.db:DbError';
    this.message = 'swift.db: ' + message;
    this.details = details;
}
$util.inherits(DbError, Error);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbError                     = DbError;
exports.DbManagerError              = require('./errors/dbManagerError').DbManagerError;
exports.MongoAdapterError           = require('./errors/mongoAdapterError').MongoAdapterError;