// Weather Widget


// Models

m.models.Weather = Backbone.Model.extend({
    localStorage: new Backbone.LocalStorage("momentum-weather"),
    defaults:{
        location: '',
        woeid: '',
        unit: 'c'
    }
});

// Collections

// Views

m.views.Weather = Backbone.View.extend({
    attributes: { id: 'weather', class: 'metric' },
    template: Handlebars.compile($("#weather-template").html()),
    events: {
        "dblclick .metric-stat" : "toggleUnit",
        "dblclick .location" : "editLocation",
        "keypress .location": "onKeypress",
        "keydown .location": "onKeydown",
        "blur .location": "saveLocation",
        "webkitAnimationEnd .location": "onAnimationEnd"
    },
    initialize: function () {
        // consolidate the top two listeners when we move to 1.0 and test toggle unit (I think that's the problem)
        this.listenTo(this.model, 'change:updated', this.render);
        this.listenTo(this.model, 'change:unit', this.render);
        this.listenTo(this.model, 'change:manualLocation', this.updateWeather);
        this.updateWeather();
        this.render(this.options.unitClass = 'hide');

        var weatherTimer = setInterval(function () {
            this.updateWeather();
        }.bind(this), 600000);
    },
    render: function() {
        var variables = { temperature: this.model.get('temperature'), location: this.model.get('location'), unit: this.model.get('unit'), condition: this.model.get('condition'), code: this.getConditionFromCode(this.model.get('code')), unitClass: this.options.unitClass };
        var order = (this.options.order  || 'append') + 'To';
        this.$el[order]('#' + this.options.region).html(this.template(variables)).fadeTo(500, 1);
        this.$location = this.$('.location');
        return this;
    },
    editLocation: function () {
        if (!this.$el.hasClass('editing')) {
          this.$location.attr('contenteditable', true).addClass('editing pulse').focus();
          setEndOfContenteditable(this.$location.get(0));
        }
    },
    onAnimationEnd: function (e) {
      if (e.originalEvent.animationName === "pulse") {
        this.$location.removeClass('pulse');
      }
    },
    onKeypress: function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            this.saveLocation();
        }
    },
    onKeydown: function (e) {
        if (e.keyCode === 27) {
            this.$location.html(this.model.get('location')); //revert
            this.doneEditingLocation();
        }
    },
    saveLocation: function () {
        this.model.save('manualLocation', this.$location.html());
        this.doneEditingLocation();
    },
    doneEditingLocation: function () {
        this.$location.attr('contenteditable', false).removeClass('editing').addClass('pulse');
    },
    toggleUnit: function () {
        this.options.unitClass = '';
        if (this.model.get('unit') == 'c') {
            this.model.save('temperature', Math.round(this.model.get('temperature') * 9 / 5 + 32));
            this.model.save('unit', 'f');
        } else {
            this.model.save('temperature', Math.round((this.model.get('temperature') - 32) * 5 / 9));
            this.model.save('unit', 'c');
        }
    },
    setUnit: function(country) {
        var f = ['US', 'BM', 'BZ', 'JM', 'PW'];
        if (f.indexOf(country) >= 0) { this.model.save('unit', 'f'); } else { this.model.save('unit', 'c'); }
    },
    updateWeather: function() {
        // Yahoo API ID
        // var APPID = 'qSgI6d54';
        var that = this;
        getLocation();

        function getLocation() {
            navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
        }
            function locationSuccess(position) {
                getWoeid(position.coords.latitude + ',' + position.coords.longitude);
            }
            function locationError(error) {
                console.log('Error getting location: ' + error.code);
            }

        function getWoeid(apiLocation) {
            if (that.model.get('manualLocation')) {
                apiLocation = that.model.get('manualLocation');
            }
            var apiQuery = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.placefinder%20where%20text%3D%22' + encodeURIComponent(apiLocation) + '%22%20and%20gflags%3D%22R%22&format=json&diagnostics=true&callback=';

            $.getJSON(apiQuery, function(r){
                var count = r.query.count;
                if (count > 1) {
                    var results = r.query.results.Result[0];
                } else if (count == 1) {
                    var results = r.query.results.Result;
                } else {
                    that.$location.append('<br>not found');
                    var results = '';
                }

                if (!that.model.get('location')) {
                    that.setUnit(results.countrycode);
                }
                var location = results.city;
                //if (results.statecode) { location = location + ' ' + results.statecode; }
                var woeid = results.woeid;

                that.model.save('location', location);
                that.model.save('woeid', woeid);
                getWeather(woeid);
            }).error( function(error) {
                console.log("Error getting WoeID");
            });
        }

        function getWeather(woeid) {
            // to test
            // http://developer.yahoo.com/yql/console/#h=select+*+from+weather.forecast+where+woeid%3D12698337+and+u%3D'c'
            var weatherYQL = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from weather.forecast where woeid=' + woeid + ' and u="'+ that.model.get('unit') + '"') + '&format=json&callback=?';
            //console.log(weatherYQL);
            $.getJSON(weatherYQL, function(r) {
                if(r.query.count == 1){
                    var weather = r.query.results.channel.item.condition;
                    //console.log(weather);
                    that.model.save('temperature', weather.temp);
                    that.model.save('code', weather.code);
                    that.model.save('condition', weather.text);
                    that.model.save('updated', new Date());
                }
                else {
                    console.log("Error getting weather data: Result count not equal to one");
                }
            }).error( function(error) {
                console.log("Error getting weather data: " + error);
            });
        }
    },
    getConditionFromCode: function(num) {
        // Code reference: http://developer.yahoo.com/weather/#codes
        var code = {};
        code[0] = "F";
        code[1] = "F";
        code[2] = "F";
        code[3] = "O";
        code[4] = "P";
        code[5] = "X";
        code[6] = "X";
        code[7] = "X";
        code[8] = "X";
        code[9] = "Q";
        code[10] = "X";
        code[11] = "R";
        code[12] = "R";
        code[13] = "U";
        code[14] = "U";
        code[15] = "U";
        code[16] = "W";
        code[17] = "X";
        code[18] = "X";
        code[19] = "J";
        code[20] = "M";
        code[21] = "J";
        code[22] = "M";
        code[23] = "F";
        code[24] = "F";
        code[25] = "G";
        code[26] = "Y";
        code[27] = "I";
        code[28] = "H";
        code[29] = "E";
        code[30] = "H";
        code[31] = "C";
        code[32] = "B";
        code[33] = "C";
        code[34] = "B";
        code[35] = "X";
        code[36] = "B";
        code[37] = "O";
        code[38] = "O";
        code[39] = "O";
        code[40] = "R";
        code[41] = "W";
        code[42] = "U";
        code[43] = "W";
        code[44] = "H";
        code[45] = "O";
        code[46] = "W";
        code[47] = "O";
        code[3200] = ")";
        return code[num];
    }
});
