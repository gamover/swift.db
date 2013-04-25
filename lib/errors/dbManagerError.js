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
//
// static
//

DbManagerError.codes = {
    ADAPTER_ALREADY_EXISTS:   'ADAPTER_ALREADY_EXISTS',
    ADAPTER_NOT_FOUND:        'ADAPTER_NOT_FOUND',
    BAD_INPUT_DATA:           'BAD_INPUT_DATA',
    CONNECT_ADAPTER_ERROR:    'CONNECT_ADAPTER_ERROR',
    CONNECT_ERROR:            'CONNECT_ERROR',
    DISCONNECT_ADAPTER_ERROR: 'ADAPTER_DISCONNECT_ERROR',
    DISCONNECT_ERROR:         'DISCONNECT_ERROR',
    REMOVE_ADAPTER_ERROR:     'REMOVE_ADAPTER_ERROR'
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbManagerError = DbManagerError;