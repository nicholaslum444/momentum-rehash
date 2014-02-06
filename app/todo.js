// -*- mode: js2; js2-basic-offset: 4 -*-
// Todo Widget


// Models

m.models.Todo = Backbone.Model.extend({
    defaults: function() {
        return {
            title: "empty todo...",
            //order: Todos.nextOrder(),
            done: false,
            archive: false,
            order: 0
        };
    },
    archive: function() {
        this.save({ archive: true });
    },
    comparator: 'order',
    toggle: function() {
        this.save({ done: !this.get("done") });
    }
});


// Collections

m.collect.Todos = Backbone.Collection.extend({
    model: m.models.Todo,
    localStorage: new Backbone.LocalStorage("momentum-todo"),
    initialize: function () {
        // setting default value for showTodoList
        if (!localStorage['showTodoList']) {
            localStorage['showTodoList'] = false;
        }
    },
    completeToday: function () {
        return this.where({ done: true, archive: false });
    },
    done: function() {
        return this.where({ done: true });
    },
    remaining: function() {
        //return this;
        return this.without.apply(this, this.done());
    },
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: 'order',
    create: function(model, options) {
        if (model.order == undefined) {
            model.order = this.nextOrder();
        }
        return Backbone.Collection.prototype.create.call(this, model, options);
    }
});


// Views

m.views.Todos = Backbone.View.extend({
    attributes: { id: 'todo' },
    template: Handlebars.compile( $("#todo-template").html() ),
    events: {
        "click .todo-toggle": "toggleShow",
        "click #clear-completed": "clearCompleted",
        "keypress #todo-new":  "createOnEnter",
        "dragover": "dragover",
        "dragend" : "dragend"
    },
    initialize: function() {
        _.bindAll(this, 'addOne', 'addAll', 'dragover', 'dragend', 'li_index');
        this.render();
        this.listenTo(this.collection, 'add', this.addOne);
        this.listenTo(this.collection, 'reset', this.addAll);
        this.listenTo(m.models.date, 'change:dayEnd', this.clearCompleted);
        this.collection.fetch();
    },
    render: function() {
        var order = (this.options.order  || 'append') + 'To';
        this.$el[order]('#' + this.options.region).html(this.template()).fadeTo(500, 1);
        m.views.todoCount = new m.views.TodoCount({ collection: m.collect.todos, order: 'append' });
        this.$placeholder = $('<li></li>').addClass('placeholder');
        this.$placeholder.appendTo(this.el);
        this.$placeholder.hide()
        if (JSON.parse(localStorage['showTodoList']) == true) { this.$el.toggleClass('show'); }
        return this;
    },
    addOne: function(todo) {
        var todoView = new m.views.Todo({ model: todo, parent: this });
        this.$(".todo-list ol").append(todoView.render().el);
    },
    addAll: function() {
        _.each(this.collection.where({ archive: false }), this.addOne);
    },
    clearCompleted: function (e) {
        _.invoke(m.collect.todos.done(), 'archive');
        return false;
    },
    createOnEnter: function (e) {
        _gaq.push(['_trackEvent', 'Todo', 'Add']);
        var val = this.$el.find('#todo-new')[0].value;
        if (e.keyCode != 13) return;
        if (!val) return;
        this.collection.create({ title: val });
        this.$el.find('#todo-new')[0].value = '';
    },
    dragover: function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.originalEvent.dataTransfer.dropEffect = 'move';
        return false;
    },
    dragend: function(e) {
        e.originalEvent.dataTransfer.dropEffect = 'move';
        e.preventDefault();
        e.stopPropagation();
        if (this.dragmode == 'todo') {
            this.dragging.$el.show();
            this.$placeholder.hide();
            this.trigger('reorder');
        }
        return false;
    },
    li_index: function(el) {
        return this.$('li').index(el);
    },
    toggleShow: function (e) {
        e.preventDefault();
        _gaq.push(['_trackEvent', 'Todo', 'Toggle Show']);
        $('#todo').toggleClass('show');
        localStorage['showTodoList'] = !JSON.parse(localStorage['showTodoList']);
        this.$el.find('#todo-new').focus();
    }
});

m.views.Todo = Backbone.View.extend({
    tagName: "li",
    template: Handlebars.compile($("#todo-item-template").html()),
    events: {
        "click .toggle"   : "toggleDone",
        "dblclick .view"  : "edit",
        "click a.destroy" : "clear",
        "keypress .edit"  : "updateOnEnter",
        "blur .edit"      : "close",
        'dragstart'       : 'dragstart',
        'dragenter'       : 'dragenter',
        'dragleave'       : 'dragleave'
    },
    initialize: function(options) {
        _.bindAll(this, 'dragstart', 'dragenter', 'dragleave', 'saveNewOrder');
        this.parent = options.parent;
        this.listenTo(this.parent, 'reorder', this.saveNewOrder);
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.model, 'change:archive destroy', this.remove);
    },
    render: function() {
        var title = this.model.get('title');
        if (this.model.get('done')) { var checked = 'checked' };
        var variables = { title: title, checked: checked };
        this.$el.html(this.template(variables));
        this.$el.toggleClass('done', this.model.get('done'));
        this.$el.prop('draggable', 'true');

        return this;
    },
    clear: function() {
        _gaq.push(['_trackEvent', 'Todo', 'Delete']);
        this.model.destroy();
    },
    close: function() {
        // cancel edit if esc key hit
        var value = this.$el.find('.edit').val();
        if (!value) {
            this.clear();
        } else {
            this.model.save({ title: value });
            this.$el.removeClass("editing");
        }
    },
    edit: function() {
        this.$el.addClass("editing");
        this.$el.find('.edit').focus();
    },
    dragstart: function(e) {
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        e.originalEvent.dataTransfer.setData('text', 'dummy');
        this.parent.dragmode = 'todo';
        this.parent.dragging = this;
    },
    dragenter: function(e) {
        if(this.parent.dragmode == 'todo') {
            this.parent.dragging.$el.hide()
            if (this.parent.li_index(this.parent.$placeholder) < this.parent.li_index(this.$el)) {
                this.$el.after(this.parent.$placeholder);
            } else {
                this.$el.before(this.parent.$placeholder)
            }
            var p = this.parent.$placeholder
            this.parent.$placeholder.css('display', 'list-item')
            p.height(this.$el.height())
            p.after(this.parent.dragging.$el)
        }
    },
    dragleave: function(e) {
    },
    saveNewOrder: function() {
        var myIndex = this.parent.li_index(this.$el);
        this.model.save({ order: myIndex });
    },
    toggleDone: function() {
        _gaq.push(['_trackEvent', 'Todo', 'Done']);
        this.model.toggle();
    },
    updateOnEnter: function(e) {
        _gaq.push(['_trackEvent', 'Todo', 'Edit']);
        if (e.keyCode == 13) this.close();
    }
});

m.views.TodoCount = Backbone.View.extend({
    el: '#todo-count',
    initialize: function() {
        this.listenTo(this.collection, 'all', this.render);
    },
    render: function() {
        var remaining = this.collection.remaining().length;
        switch(remaining) {
            case 0:
                var str = "Nothing to do! ☺";
                break;
            case 1:
                var str = remaining + " thing to do";
                break;
            default:
                var str = remaining + " things to do";
        }
        $(this.el).html(str);
        return this;
    }
});

m.views.TodosComplete = Backbone.View.extend({
    attributes: { id: 'todo-complete', class: 'metric' },
    template: Handlebars.compile($("#todo-complete-template").html()),
    initialize: function () {
        this.listenTo(this.collection, 'all', this.render);
        this.render();
    },
    render: function () {
        var done = this.collection.completeToday().length;
        var item = 'todos';
        if (done == 1) { item = "todo" }
        var variables = { done: done, item: item };

        var order = (this.options.order  || 'append') + 'To';
        this.$el[order]('#' + this.options.region).html(this.template(variables)).fadeTo(500, 1);
        if (done) {
            this.$el.show();
        } else {
            this.$el.hide();
        }
        return this;
    }
});
