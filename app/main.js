// Momentum Dashboard Page Script

/** Models **/
m.models.Date = Backbone.Model.extend({
    defaults: function () {
        var date = new Date();
        var dayEnd = localStorage['dayEnd'] || '';
        var hour12clock = JSON.parse(localStorage.hour12clock);
        return {
            date: date,
            dayEnd: dayEnd,
            hour12clock: hour12clock
        }
    },
    initialize: function(){
        this.dateChange();
        this.listenTo(this, 'change:date', this.updateTime);
    },
    getTime: function(date) {
        var hour12clock = this.get('hour12clock');
        var hour = date.getHours();
        var minute = date.getMinutes();
        if (hour12clock == true) {
            hour = ((hour + 11) % 12 + 1);
        }
        if (hour < 10 && !hour12clock) { hour = "0" + hour; }
        if (minute < 10) { minute = "0" + minute; }
        return hour + ':' + minute;
    },
    getTimePeriod: function() {
        if (this.get('date').getHours() >= 12) { return 'PM'; } else { return 'AM' };
    },
    updateTime: function() {
        var now = this.getTime(this.get('date'));
        if (this.get('time') != now) {
            this.set('time', now);
        }
    },
    dateChange: function(){
        var that = this;
        var now = Date.parse(this.get('date'));
        var dayEnd = localStorage['dayEnd'] || '';

        if (now >= dayEnd) {
            var dayEnd = Date.parse(this.getDayEnd());
            // SUPER HACKY FIX
            setTimeout(function(){
                //console.log('delayed dayend set');
                that.set("dayEnd", dayEnd);
                localStorage['dayEnd'] = dayEnd;
            }, 200);
        }
        var dayRemaining = dayEnd - now;
        //console.log('hours remaining in day: ' + Math.floor(dayRemaining / 1000 / 60 / 60));

        setTimeout(function(){
            console.log("It's a new day!!!");
            that.dateChange();
        }, dayRemaining);
    },
    getDayEnd: function () {
        var now = this.get('date');
        var dayEnd = this.get('date');
        dayEnd.setDate(now.getDate() + 1);
        dayEnd.setHours(5,0,0,0);
        // comment out setdate/sethours and uncomment setseconds to test quick day changes
       // dayEnd.setSeconds(now.getSeconds()+2);
        return dayEnd;
    }
});


/** Collections **/



/** Views **/

m.views.CenterClock = Backbone.View.extend({
    id: 'centerclock',
    template: Handlebars.compile( $("#centerclock-template").html() ),
    events: {
        "dblclick": "toggleFormat",
    },
    initialize: function () {
        this.render();
        this.listenTo(this.model, 'change:time', this.updateTime, this);
    },
    render: function () {
        var time = this.model.getTime(this.model.get('date'));

        var variables = { time: time };
        var order = (this.options.order  || 'append') + 'To';

        this.$el[order]('#' + this.options.region).html( this.template(variables) ).fadeTo(500, 1);
        this.$time = this.$('.time');
        this.$format = this.$('.format');
    },
    toggleFormat: function () {
        var hour12clock = !this.model.get('hour12clock');
        this.model.set({ hour12clock: hour12clock });
        localStorage.hour12clock = hour12clock;
        if (hour12clock) {
            setTimeout(function(){
                $('.format').addClass('show');
            }, 40);
            this.$format.html(this.model.getTimePeriod());
        } else {
            $('.format').removeClass('show');
        }
    },
    updateTime: function () {
        this.$time.html(this.model.getTime(this.model.get('date')));
    }
});

function setEndOfContenteditable(contentEditableElement) {
    var range, selection;
    if (document.createRange) { //Firefox, Chrome, Opera, Safari, IE 9+
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
}

m.views.Greeting = Backbone.View.extend({
    id: 'greeting',
    template: Handlebars.compile( $("#greeting-template").html() ),
    events: {
        "dblclick .name": "editName",
        "keypress .name": "onKeypress",
        "keydown .name": "onKeydown",
        "blur .name": "saveName",
        "webkitAnimationEnd .name": "onAnimationEnd"
    },
    initialize: function () {
        this.render();
        this.listenTo(this.model, 'change:time', this.updatePeriod, this);
    },
    render: function () {
        var period = this.getPeriod();
        var name = localStorage.name;
        var variables = { period: period, name: name };
        var order = (this.options.order  || 'append') + 'To';

        this.$el[order]('#' + this.options.region).html( this.template(variables) ).fadeTo(500, 1);

        this.$period = this.$('.period');
        this.$name = this.$('.name');
    },
    getPeriod: function () {
        var now = this.model.get('date');
        var hour = now.getHours();
        var period;
        if (hour >= 3 && hour < 12) period = 'morning';
        if (hour >= 12 && hour < 17) period = 'afternoon';
        if (hour >= 17 || hour < 3) period = 'evening';
        return period;
    },
    updatePeriod: function () {
        this.$period.html(this.getPeriod());
    },
    editName: function () {
        if (!this.$name.hasClass('editing')) {
          this.$name.attr('contenteditable', true).addClass('editing pulse').focus();
          setEndOfContenteditable(this.$name.get(0));
        }
    },
    onAnimationEnd: function (e) {
      if (e.originalEvent.animationName === "pulse") {
        this.$name.removeClass('pulse');
      }
    },
    onKeypress: function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            this.saveName();
        }
    },
    onKeydown: function (e) {
        if (e.keyCode === 27) {
            this.$name.html(localStorage.name); //revert
            this.doneEditingName();
        }
    },
    saveName: function () {
        var newName = this.$name.html();
        if (newName === "") {
          this.$name.html(localStorage.name); //revert
        } else {
          localStorage.name = newName;
        }
        this.doneEditingName();
    },
    doneEditingName: function () {
        this.$name.attr('contenteditable', false).removeClass('editing').addClass('pulse');
    }
});

m.views.Introduction = Backbone.View.extend({
    attributes: { id: 'introduction' },
    template: Handlebars.compile( $("#introduction-template").html() ),
    events: {
        "keypress input": "updateOnEnter"
    },
    initialize: function () {
        this.render();
    },
    render: function () {
        var order = (this.options.order  || 'append') + 'To';
        this.$el[order]('#' + this.options.region).html(this.template()).fadeTo(1000, 1);
    },
    updateOnEnter: function(e) {
        if (e.keyCode == 13) this.save();
    },
    save: function() {
        var name = this.$el.find('input')[0].value;
        localStorage['name'] = name;
        $.post( "https://php-momentumdash.rhcloud.com/users", { name: name });
        var that = this;
        this.$el.fadeTo(1000,0, function () {
            that.remove();
            m.appView.render();
        });
    }
});



// Parent view
m.views.Dashboard = Backbone.View.extend({
    initialize: function () {
        // set up empty localstorage variables for JSON.parse
        // remove this one we get sync set up
        if (!localStorage.hour12clock) {
            localStorage.hour12clock = false;
        }
        if (!localStorage['momentum-messageRead']) {
            localStorage['momentum-messageRead'] = JSON.stringify({ version: "0" });
        }

        m.models.date = new m.models.Date();

        var dateTimer = setInterval(function () {
            m.models.date.set('date', new Date());
        }, 50);

        m.collect.backgrounds = new m.collect.Backgrounds();

        // JO: Fetch is async so wait for results before instantiating view
        m.collect.backgrounds.fetch({
            success: function(response, xhr) {
                 m.views.background = new m.views.Background({ collection: m.collect.backgrounds, model: m.models.date, region: 'background' });
            },
            error: function (errorResponse) {
                   console.log(errorResponse)
            }
        });

        if (!localStorage['name']) {
            m.views.introduction = new m.views.Introduction({ region: 'center' });
        } else {
            this.render();
        }
    },
    render: function () {
        // Load widgets
        m.views.greeting = new m.views.Greeting({ model: m.models.date, region: 'center', order: 'prepend' });
        m.views.centerClock = new m.views.CenterClock({ model: m.models.date, region: 'center', order: 'prepend' });

        m.collect.todos = new m.collect.Todos();
        m.views.todos = new m.views.Todos({ collection: m.collect.todos, region: 'bottom-right', order: 'append' });
        m.views.todosComplete = new m.views.TodosComplete({ collection: m.collect.todos, region: 'top-right', order: 'prepend' });

        m.collect.focuses = new m.collect.Focuses();
        m.collect.focuses.fetch({
            success: function(response, xhr) {
                m.views.focuses = new m.views.Focuses({ collection: m.collect.focuses, model: m.models.date, region: 'center-below', order: 'append' });
            },
            error: function (errorResponse) {
                   console.log(errorResponse)
            }
        });

        m.collect.shortquotes = new m.collect.ShortQuotes();
        m.collect.shortquotes.fetch({
            success: function(response, xhr) {
                m.views.shortQuote = new m.views.ShortQuote({ collection: m.collect.shortquotes, model: m.models.date, region: 'bottom' });
            },
            error: function (errorResponse) {
                   console.log(errorResponse)
            }
        });

        m.models.weather = new m.models.Weather({ id: 1 });
        m.models.weather.fetch();
        m.views.weather = new m.views.Weather({ model: m.models.weather, region: 'top-right', order: 'append' });

        m.collect.messages = new m.collect.Messages();
        m.collect.messages.fetch({
            success: function(response, xhr) {
                var appVersion = chrome.app.getDetails().version;
                var messageRead = JSON.parse(localStorage['momentum-messageRead']);

                if (!messageRead.version || appVersion > messageRead.version) {
                    // new version of app, update messageread
                    messageRead = { version: appVersion, count: 0, hide: false };
                    localStorage['momentum-messageRead'] = JSON.stringify(messageRead);
                }

                if (appVersion == messageRead.version && !messageRead.hide) {
                    // show view
                    m.views.message = new m.views.Message({ model: m.collect.message, modelUser: m.models.user, region: 'center-above' });
                }
            },
            error: function (errorResponse) {
                   console.log(errorResponse)
            }
        })
    }
});


/** Bootstrap **/

$(function() {

    /* Init */

    $(document).ready(function() {

        /* Create parent AppView */

        m.appView = new m.views.Dashboard();

        $('#app-return').css('opacity','0').fadeTo(500, 1);

        $('#app-return a').click(function(e) {
            e.preventDefault();
            _gaq.push(['_trackEvent', 'Meta', 'Back to Apps']);
            chrome.tabs.update({
                url:'chrome-internal://newtab/'
            });
        });
    });

});




var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-44319322-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/u/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
