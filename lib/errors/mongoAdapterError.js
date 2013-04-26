/**
 * Created by G@mOBEP
 *
 * Date: 21.04.13
 * Time: 11:59
 */

var $util = require('util'),

    SwiftDbError = require('./swiftDbError').SwiftDbError;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MongoAdapterError (message, details)
{
    SwiftDbError.call(this, 'MongoAdapter: ' + message, details);
    Error.captureStackTrace(this, arguments.callee);

    this.name = 'swift.db:MongoAdapterError';
}
$util.inherits(MongoAdapterError, SwiftDbError);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// static
//

MongoAdapterError.codes = {
    BAD_CONNECTION_NAME:         'BAD_CONNECTION_NAME',
    BAD_CONNECTION_PARAMS:       'BAD_CONNECTION_PARAMS',
    CONNECTION_ALREADY_EXISTS:   'CONNECTION_ALREADY_EXISTS',
    CONNECTION_NOT_FOUND:        'CONNECTION_NOT_FOUND',
    CONNECTION_PARAMS_NOT_FOUND: 'CONNECTION_PARAMS_NOT_FOUND',
    MONGOOSE_NOT_FOUND:          'MONGOOSE_NOT_FOUND',
    SYSTEM_ERROR:                'SYSTEM_ERROR'
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapterError = MongoAdapterError;