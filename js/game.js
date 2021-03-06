define(["lodash", "backbone", "jquery", "js/enum", "js/views/header", "js/models/dataAccessor"],
    function(_, Backbone, $, Enum, HeaderView, DataAccessor) {
        var game = {
                eventsBus: _.extend({}, Backbone.Events),
                db: null,
                router: null,
                status: Enum.GameStatus.LOADING,
                initializeDfd: new $.Deferred()
            };

        _.extend(game, {
            VERSION: "0.2",

            initialize: function (router) {
                var header = new HeaderView({ el: $("#header").get(0) });

                this.router = router;

                this.printVersionInfo();

                header.render();

                if (!this.checkBrowser()) {
                    return router.navigate("error/" + Enum.GameErrorTypes.OLD_BROWSER, { trigger: true });
                }

                this.eventsBus.on("header.toggleInstructions", _.bind(header.toggleInstructions, header));

                this.db = new DataAccessor({ encrypter: CryptoJS });
                this.initializeDB()
                    .done(function () {
                        game.status = Enum.GameStatus.READY;
                        game.initializeUser().then(function (user) {
                            game.db.saveCurrentUserName(user.get("name"));
                            game.eventsBus.trigger("levels.loaded");
                            game.initializeDfd.resolve();
                        });
                    })
                    .fail(function () {
                        return router.navigate("error/" + Enum.GameErrorTypes.NO_LEVELS_LOADED, { trigger: true });
                    });
            },

            onInitialize: function (callback) {
                $.when(this.initializeDfd).done(callback);
            },

            printVersionInfo: function () {
                var log = console && console.log || function () {};
                log.call(console, "===========================");
                log.call(console, "= Backbone: " + Backbone.VERSION);
                log.call(console, "= Lodash: " + _.VERSION);
                log.call(console, "= jQuery: " + $.fn.jquery);
                log.call(console, "= Link It: " + this.VERSION);
                log.call(console, "===========================");
            },

            checkBrowser: function () {
                return !! (window.indexedDB && window.localStorage);
            },

            initializeDB: function () {
                return this.db.initDB()
                    .then(function () {
                        if (game.db.getLevelsCount() < 1) {
                            //no levels - let's try to load them!
                            return game.db.fetchLevels().then(function () {
                                game.eventsBus.trigger("levels.loaded");
                            });
                        }
                    });
            },

            initializeUser: function () {
                return this.db.initUser(this.db.getCurrentUserName());
            },

            navigateToLevel: function (levelNum) {
                var router = this.router,
                    db = this.db;

                return this.db.getCurrentUserActiveLevel().then(function (activeLevel) {
                    if (levelNum <= activeLevel) {
                        if (db.getLevelsCount() >= levelNum) {
                            router.navigate("level/" + levelNum);
                            router.hideCurrentView();
                            return router.showLevelView(levelNum);
                        } else {
                            return router.navigate("gameOver", { trigger: true });
                        }
                    } else {
                        return router.navigate("error/" + Enum.GameErrorTypes.PAGE_NOT_FOUND, { trigger: true });
                    }
                }, function (e) {
                    return router.navigate("error/" + Enum.GameErrorTypes.USER_ERROR, { trigger: true });
                });
            },

            updateActiveLevel: function (passedLevelIndex) {
                var db = this.db;

                return db.getCurrentUserActiveLevel().then(function (activeLevel) {
                    if (activeLevel === passedLevelIndex) {
                        return db.setCurrentUserActiveLevel(passedLevelIndex + 1);
                    } else {
                        return passedLevelIndex + 1;
                    }
                });
            }

        });

        return game;
});