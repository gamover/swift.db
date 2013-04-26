/**
 * Created by G@mOBEP
 *
 * Date: 21.04.13
 * Time: 11:58
 */

var $util = require('util'),

    SwiftDbError = require('./swiftDbError').SwiftDbError;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbManagerError (message, details)
{
    SwiftDbError.call(this, 'DbManager: ' + message, details);
    Error.captureStackTrace(this, arguments.callee);

    this.name = 'swift.db:DbManagerError';
}
$util.inherits(DbManagerError, SwiftDbError);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// static
//

DbManagerError.codes = {
    ADAPTER_ALREADY_EXISTS: 'ADAPTER_ALREADY_EXISTS',
    ADAPTER_NOT_FOUND:      'ADAPTER_NOT_FOUND',
    BAD_ADAPTER:            'BAD_ADAPTER',
    BAD_ADAPTER_NAME:       'BAD_ADAPTER_NAME',
    BAD_INPUT_DATA:         'BAD_INPUT_DATA',
    SYSTEM_ERROR:           'SYSTEM_ERROR'
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbManagerError = DbManagerError;