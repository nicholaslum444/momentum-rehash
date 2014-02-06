// Meta Widget


// Models

m.models.Message = Backbone.Model.extend({
    parse: function(response) {
        this.set({ version: response.version, title: response.title, message: response.message });
    }
});

// Collections

m.collect.Messages = Backbone.Collection.extend({
    model: m.models.Message,
    url: 'app/messages.json',
    parse: function (response) {
        return response.messages;
    }
});

// Views

m.views.Message = Backbone.View.extend({
    id: 'message',
    attributes: { class: '' },
    template: Handlebars.compile($("#message-template").html()),
    events: {
        "click .hide": "hideMessageClick"
    },
    initialize: function () {
        this.render();
    },
    render: function() {
        var appVersion = chrome.app.getDetails().version;
        var message = m.collect.messages.where({ version: appVersion })[0].attributes;
        this.messageRead = JSON.parse(localStorage['momentum-messageRead']);

        var variables = { title: message.title, message: message.message };
        var order = (this.options.order  || 'append') + 'To';
        this.$el[order]('#' + this.options.region).html(this.template(variables)).fadeTo(500, 1).addClass('softpulse');
        this.addCount();
        return this;
    },
    addCount: function () {
        this.messageRead.count = this.messageRead.count + 1;
        localStorage['momentum-messageRead'] = JSON.stringify(this.messageRead);
        if (this.messageRead.count > 4) { console.log('hiding message'); this.hideMessage(); }
    },
    hideMessageClick: function (e) {
        e.preventDefault();
        $(this.el).fadeTo(0, 0);
        this.hideMessage();
    },
    hideMessage: function () {
        console.log(this.messageRead);
        this.messageRead.hide = true;
        localStorage['momentum-messageRead'] = JSON.stringify(this.messageRead);
        _gaq.push(['_trackEvent', 'Message', 'Hide', this.messageRead.count]);
    }
});
