CalEvent = new Mongo.Collection('calevent');

Router.route('/');
Router.route('/Home');
Router.route('/TouristHotspots');
Router.route('/ShoppingMalls');
Router.route('/Foodplaces');

if (Meteor.isClient) {

Template.dialog.events({
  'click .closeDialog':function(event, template){
    Session.set('editing_event',null);
  },
  'click .updateTitle':function(evt,tmpl){
    var title = tmpl.find('#title').value;
    Meteor.call('updateTitle',Session.get('editing_event'),title);
    Session.set('editing_event',null);
  }
});
Template.main.helpers({
  editing_event: function(){
    return Session.get('editing_event');
  }
});
Template.dialog.helpers({
  title: function(){
    var ce = CalEvent.findOne({_id:Session.get('editing_event')});
    return ce.title;
  }
});
Template.dialog.rendered = function(){
  if(Session.get('editDialog')){
    var calevent = CalEvent.findOne({_id:Session.get('editing_event')});
    if(calevent){
      $('#title').val(calevent.title);
    }
  }
}
  Template.main.rendered = function(){
    var calendar = $('#calendar').fullCalendar({
        dayClick:function(date,jsEvent,view){ //EDITED
          var calendarEvent = {}; //empty object
          calendarEvent.start = date;
          calendarEvent.end = date;
          calendarEvent.title = 'New Event';
          calendarEvent.owner = Meteor.userId();
          Meteor.call('saveCalEvent',calendarEvent);
        },
        eventClick:function(calEvent,jsEvent,view){
          Session.set('editing_event',calEvent._id);
          $('#title').val(calEvent.title);
        },
        eventRender: function(event, element) {
            element.append( "<span class='closeon' style='color:red'><u><b><br>Delete</b></u></span>" );
            element.find(".closeon").click(function() {
               $('#calendar').fullCalendar('removeEvents',event._id);
            });
            Meteor.call('removeEvent');
        },
        eventDrop:function(reqEvent){
          Meteor.call('moveEvent',reqEvent);
        },
        events:function(start,end,callback){
          var calEvents = CalEvent.find({},{reactive:false}).fetch();
          callback(calEvents);
        },
        editable:true,
        selectable:true
    }).data().fullCalendar;
    Deps.autorun(function(){
      CalEvent.find().fetch();
      if(calendar){
        calendar.refetchEvents();
      }
    })
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      'saveCalEvent':function(ce){
        CalEvent.insert(ce);
      },
      'updateTitle':function(id,title){
        return CalEvent.update({_id:id},{$set:{title:title}});
      },
      'removeEvent':function(){
        return CalEvent.remove({_id:this.id});
      },
      'moveEvent':function(reqEvent){
        return CalEvent.update({_id:reqEvent._id},{
          $set:{
            start:reqEvent.start,
            end:reqEvent.end
          }
        })
      }
    })
  });
}
