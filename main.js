var router = function (project) {
    this.map = {};
    this.list = [];
    this.hasDot = /\{\w*\}/g;
    this.url = "";
    this.project = project;
};
router.prototype.add = function (path, action, controller) {
    path = path.replace(/[\/]+/g, "/");
    if (path[path.length - 1] !== "/") {
        path = path + "/";
    }
    var has = false, count = 0, start = 0, pars = [];
    var pathx = path.replace(this.hasDot, function (a, b) {
        has = true;
        if (count === 0) {
            start = b;
        }
        pars.push(a.substring(1, a.length - 1));
        count++;
        return "((?!/).)*";
    });
    if (has) {
        var info = {};
        info.originalpath = path;
        info.pattern = new RegExp("^" + pathx + "$");
        info.count = count;
        info.patternString = "^" + pathx + "/$";
        info.firstposition = start;
        info.keys = pars;
        info.controller = controller;
        info.action = action;
        var aStrings = path.split("\\.");
        if (aStrings.length > 1) {
            info.suffix = aStrings[1];
        }
        this.list.push(info);
    } else {
        this.map[path] = {
            controller: controller,
            action: action
        };
    }
};
router.prototype.check = function (path) {
    if (this.project === "ROOT") {
        path = (path.split("?")[0]+ "/").replace(/[\/]+/g, "/").trim();
    } else {
        path = (path.split("?")[0]+ "/").replace(/[\/]+/g, "/").trim().substring(this.project.length + 1);
    }
    var result = {
        found: false,
        hasParas: false,
        path: "",
        matchpath: "",
        map: {}
    };
    var suffix = "", bString = path.split("\\.");
    if (bString.length > 1) {
        suffix = bString[1];
        path = path + "/";
    }
    if (this.map.hasOwnProperty(path)) {
        result.path = path;
        result.matchpath = path;
        result.found = true;
        result.controller = this.map[path].controller;
        result.action = this.map[path].action;
        return result;
    } else {
        var a = null;
        for (var i in this.list) {
            var info = this.list[i];
            if (info.pattern.test(path)) {
                if (null === a) {
                    a = info;
                } else if (info.suffix === suffix) {
                    if (info.count <= a.count) {
                        if (info.firstposition > a.firstposition) {
                            a = info;
                        }
                    }
                }
            }
        }
        if (null !== a) {
            var p = path.split("/"), pp = a.originalpath.split("/");
            var cd = 0;
            for (var i = 0; i < pp.length; i++) {
                if (pp[i].indexOf("{")!==-1) {
                    var sta=pp[i].indexOf("{"),las=pp[i].length-pp[i].indexOf("}")-1;
                    result.map[a.keys[cd]]=p[i].substring(sta,p[i].length-las);
                    cd++;
                }
            }
            result.hasParas = true;
            result.path = a.originalpath;
            result.matchpath = path;
            result.found = true;
            result.controller = info.controller;
            result.action = info.action;
        }
        return result;
    }
};
module.exports = function (project) {
    return new router(project);
};