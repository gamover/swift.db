/**
 * Created by G@mOBEP
 *
 * Date: 20.04.13
 * Time: 17:28
 */

var DbManager = require('./lib/dbManager').DbManager;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.dbManager = new DbManager();
exports.DbManager = DbManager;