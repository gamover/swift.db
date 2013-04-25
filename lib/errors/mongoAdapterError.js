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
//
// static
//

MongoAdapterError.codes = {
    BAD_INPUT_DATA:              'BAD_INPUT_DATA',
    CONNECT_ERROR:               'CONNECT_ERROR',
    CONNECTION_ALREADY_EXISTS:   'CONNECTION_ALREADY_EXISTS',
    CONNECTION_NOT_FOUND:        'CONNECTION_NOT_FOUND',
    CONNECTION_PARAMS_NOT_FOUND: 'CONNECTION_PARAMS_NOT_FOUND',
    DISCONNECT_ERROR:            'DISCONNECT_ERROR',
    MONGOOSE_NOT_FOUND:          'MONGOOSE_NOT_FOUND',
    REMOVE_CONNECTION_ERROR:     'REMOVE_CONNECTION_ERROR'
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MongoAdapterError = MongoAdapterError;