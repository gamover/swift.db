/**
 * Created by G@mOBEP
 *
 * Date: 21.04.13
 * Time: 11:59
 */

var $util = require('util'),

    DbError = require('../error').DbError;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MongoAdapterError (message, details)
{
    DbError.call(this, 'MongoAdapter: ' + message, details);
    Error.captureStackTrace(this, arguments.callee);

    this.name = 'swift.db:MongoAdapterError';
}
$util.inherits(MongoAdapterError, DbError);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapterError = MongoAdapterError;