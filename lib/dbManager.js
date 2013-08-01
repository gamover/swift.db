/**
 * Created by G@mOBEP
 *
 * Company: Realweb
 * Date: 21.03.13
 * Time: 13:24
 *
 * Менеджер баз данных Swift.
 */

var $util = require('util'),

    $async = require('async'),

    $swiftErrors = require('swift.errors'),
    $swiftUtils = require('swift.utils'),

    MongoAdapterPkg = require('./dbAdapters/mongoAdapter'),

    DbAdapter = require('./dbAdapters/dbAdapter').DbAdapter,

    adapters = {};

adapters[MongoAdapterPkg.adapterType.toLowerCase()] = MongoAdapterPkg.MongoAdapter;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DbManager ()
{
    /**
     * Набор адаптеров
     *
     * @type {Object}
     * @private
     */
    this._adapters = {};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Создание адаптера
 *
 * @param {String} adapterType тип адаптера
 * @param {String} adapterName имя адаптера
 *
 * @returns {DbAdapter}
 */
DbManager.prototype.createAdapter = function createAdapter (adapterType, adapterName)
{
    var adapter = new adapters[adapterType]();

    if (adapterName != null)
    {
        //
        // задание имени адаптеру
        //
        adapter.setName(adapterName);
    }
    //
    // добавление адаптера в набор
    //
    this.addAdapter(adapter);

    return adapter;
};

/**
 * Добавление адаптера
 *
 * @param {DbAdapter} adapter адаптер
 *
 * @returns {DbManager}
 */
DbManager.prototype.addAdapter = function addAdapter (adapter)
{
    var self = this,
        adapterName = adapter.getName(),
        adapterSetName = adapter.setName;

    if (adapterName in this._adapters)
    {
        throw new $swiftErrors.SystemError('адаптер с именем "' + adapterName + '" уже существует');
    }
    //
    // перегрузка метода задания имени логгера
    //
    adapter.setName = function setName (name)
    {
        var currentName = this._name;

        if (name === currentName)
        {
            return this;
        }

        if (name in self._adapters)
        {
            throw new $swiftErrors.ValueError('адаптер с именем "' + name + '" уже существует');
        }

        adapterSetName.call(this, name);
        //
        // изменение имени адаптера в наборе
        //
        self._adapters[name] = self._adapters[currentName];
        delete self._adapters[currentName];

        return this;
    };
    //
    // добавление адаптера
    //
    this._adapters[adapterName] = adapter;

    return this;
};

/**
 * Получение адаптера
 *
 * @param {String} adapterName имя адаптера
 *
 * @returns {DbAdapter|null}
 */
DbManager.prototype.getAdapter = function getAdapter (adapterName)
{
    return (this._adapters[adapterName] || null);
};

/**
 * Получение всех адаптеров
 *
 * @returns {Object}
 */
DbManager.prototype.getAllAdapters = function getAllAdapters ()
{
    return this._adapters;
};

/**
 * Удаление адаптера
 *
 * @param {String} adapterName имя адаптера
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.removeAdapter = function removeAdapter (adapterName, cb)
{
    var self = this,
        adapter;

    if (!cb)
    {
        cb = function(){};
    }

    if (!(adapterName in this._adapters))
    {
        cb(null);
        return this;
    }

    adapter = this._adapters[adapterName];
    //
    // разрыв соединений адаптера
    //
    adapter.disconnect(function (err)
    {
        if (err)
        {
            cb(err);
            return;
        }
        //
        // удаление адаптера из набора
        //
        delete self._adapters[adapterName];

        cb(null);
    });

    return this;
};

/**
 * Удаление всех адаптеров
 *
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.removeAllAdapters = function removeAllAdapters (cb)
{
    var self = this;

    if (!cb)
    {
        cb = function () {};
    }
    //
    // удаление адаптеров
    //
    $async.each(this._adapters, function (adapterName, stop)
    {
        self.removeAdapter(adapterName, function (err)
        {
            stop(err);
        });
    }, function (err)
    {
        cb(err);
    });

    return this;
};

/**
 * Установление соединений всех адаптеров
 *
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.connect = function connect (cb)
{
    var self = this;

    if (!cb)
    {
        cb = function () {};
    }
    //
    // установление соединений в адаптерах
    //
    $async.each(this._adapters, function (adapterName, stop)
    {
        self._adapters[adapterName].connect(function (err)
        {
            stop(err);
        });
    }, function (err)
    {
        cb(err);
    });

    return this;
};

/**
 * Разрыв соединений всех адаптеров
 *
 * @param {Function} cb
 *
 * @returns {DbManager}
 */
DbManager.prototype.disconnect = function disconnect (cb)
{
    var self = this;

    if (!cb)
    {
        cb = function () {};
    }
    //
    // разрыв соединений в адаптерах
    //
    $async.each(this._adapters, function (adapterName, stop)
    {
        self._adapters[adapterName].disconnect(function (err)
        {
            stop(err);
        });
    }, function (err)
    {
        cb(err);
    });

    return this;
};

/**
 * Прослойка коннектора с БД
 *
 * @returns {Function}
 */
DbManager.prototype.connector = function connector ()
{
    var self = this;

    return function (req, res, next)
    {
        self.connect(function (err)
        {
            if (err)
            {
                var error = new Error();

                error.status = 500;
                error.message = 'error connecting to database';

                next(error);

                return;
            }

            next();
        });
    };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.DbManager = DbManager;