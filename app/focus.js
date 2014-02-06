// Focus Widget


// Models

m.models.Focus = Backbone.Model.extend({
    defaults: {
        focus: '',
        day: ''
    }
});


// Collections

m.collect.Focuses = Backbone.Collection.extend({
    model: m.models.Focus,
    localStorage: new Backbone.LocalStorage("momentum-focus"),
    initialize: function(){
    }
});


// Views

// Focus parent view
m.views.Focuses = Backbone.View.extend({
    attributes: { id: 'focuses' },
    template: Handlebars.compile( $('#focuses-template').html() ),
    events: {
        "dblclick"  : "edit"
    },
    initialize: function () {
        this.render();
        this.listenTo(this.model, 'change:dayEnd', this.changeDay)
        this.listenTo(m.collect.focuses, 'add', this.addToday);
        this.listenTo(m.collect.focuses, 'remove', this.delToday);
    },
    render: function () {
        var that = this;
        var order = (this.options.order  || 'append') + 'To';
        this.$el[order]('#' + this.options.region).html(this.template()).fadeTo(500, 1);

        if (this.collection.length > 0) {
            m.views.todayFocus = new m.views.Focus({ model: this.collection.at(0) });
            that.$el.find('ol').append(m.views.todayFocus.render().$el.fadeTo(500, 1));
        } else {
            m.views.focusPrompt = new m.views.FocusPrompt();
            this.$el.prepend(m.views.focusPrompt.render().$el.fadeTo(500, 1));
        }

        return this;
    },
    addToday: function (model) {
        _gaq.push(['_trackEvent', 'Focus', 'Save']);
        m.views.todayFocus = new m.views.Focus({model: model});
        this.$el.find('ol').append(m.views.todayFocus.render().$el.fadeTo(500, 1));
    },
    changeDay: function () {
        var that = this;
        // JO: This will eventually handle setting today's focus to yesterday's and re-rendering. For now it's just clearing today's focus.
        if (this.collection.at(0)) {
            m.views.todayFocus.$el.fadeTo(500,0, function () {
                that.collection.at(0).destroy();
                m.views.todayFocus.remove();
            });
        }
    },
    delToday: function () {
        _gaq.push(['_trackEvent', 'Focus', 'Delete']);
        this.render();
    },
    edit: function() {
    }
});

// Ask for today's focus
m.views.FocusPrompt = Backbone.View.extend({
    attributes: { class: 'prompt' },
    template: Handlebars.compile( $('#focus-prompt-template').html() ),
    events: {
        "keypress input": "updateOnEnter"
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.html(this.template());
        return this;
    },
    updateOnEnter: function(e) {
        if (e.keyCode == 13) this.save();
    },
    save: function() {
        var val = this.$el.find('input')[0].value;
        var that = this;
        this.$el.fadeTo(500,0, function () {
            that.remove();
            m.collect.focuses.create({ focus: val, day: 'today' });
        });
    }
});

// Individual focus items
m.views.Focus = Backbone.View.extend({
    tagName: 'li',
    attributes: { class: 'focus' },
    template: Handlebars.compile( $('#focus-template').html() ),
    events: {
        "click .delete": "destroy"
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        var variables = { focus: this.model.get('focus'), day: this.model.get('day') };
        this.$el.html(this.template(variables));
        return this;
    },
    destroy: function() {
        var that = this;

        this.$el.fadeTo(500,0, function () {
            that.model.destroy();
            that.remove();
        });
    }
});
