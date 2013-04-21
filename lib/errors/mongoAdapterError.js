/**
 * Created by G@mOBEP
 *
 * Date: 21.04.13
 * Time: 11:59
 */

var $util = require('util'),

    $swiftUtils = require('swift.utils'),
    typeUtil = $swiftUtils.type,

    DbError = require('../error').DbError;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MongoAdapterError (message, details)
{
    DbError.call(this, message, details);
    Error.captureStackTrace(this, arguments.callee);

    this.name = 'swift.db:MongoAdapterError';
}
$util.inherits(MongoAdapterError, DbError);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapterError = MongoAdapterError;