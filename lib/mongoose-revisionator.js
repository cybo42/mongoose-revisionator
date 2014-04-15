'use strict';
var mongoose = require('mongoose');
var debug = require('debug')('docVer');

module.exports = exports = function documentVersions (schema, options) {
  if(options && options.collection){

    var versionSchema = mongoose.Schema({
//      sourceId: String,
      sourceId: schema.path('_id').options.type,
      revision: mongoose.Schema.Types.Mixed,
      modified: {type: Date, default: function(){return new Date();}},
      comment: String
    });

    schema.add({revisionId: mongoose.Schema.Types.ObjectId});
    schema.virtual('comment').get(function(){
      return this._comment;
    });
//
    schema.virtual('comment').set(function(comment){
      debug("Virtual settter");
      this._comment = comment;
    });

    var VersionModel = mongoose.model(options.collection, versionSchema);

    schema.pre('save', function(next){
      var source = this;
      debug("saving revision");
      debug("comment %s", source.get('comment'));

      var version = new VersionModel({revision: this});
      version.sourceId = this._id;
      version.revision.revisionId = undefined;
      version.comment = this.get('comment');

      version.save(function(err, revision){
        source.revisionId = revision._id;
        if(err){
          debug("Could not save revision: ", err);
          next(err);
        }

        debug("saved revision ", revision._id);
        next();
      });
    });


    schema.method('findRevisions', function(criteria, callback){
      var query = {sourceId: this._id};
      if(typeof criteria === 'function'){
        callback = criteria;
        criteria = {};
      }

      if(criteria && (typeof criteria !== 'object')){
        callback(new Error("criteria must be object"), null);
        return;
      }

      if(criteria){
        Object.keys(criteria).forEach(function(fieldName){
          query['revision.' + fieldName] = criteria[fieldName];
        });
      }

      debug("getting revisions");

      VersionModel.find(query, callback);

    });

    schema.static('activateRevision', function(id, revisionId, callback){
      debug("I've been called %s %s %s", id, revisionId, callback);
      VersionModel.findById(revisionId, function(err, revision){
        if(err){
          callback(err, null);
          return;
        }
        debug("Located revision %s", revision._id);
        if(revision){
          var SourceModel = mongoose.model(options.sourceModel);
//          var reverted = new SourceModel(revision.revision);
//          reverted.__v = 0;
          var reverted = revision.revision;
          delete reverted._id;
          reverted.revisionId = revision._id;

          debug("preparing to save %j", reverted);
          SourceModel.findByIdAndUpdate(id, reverted, function(err, saved){
            if(err){
              debug("error reverting", err);
              callback(err, null);
              return;
            }

            debug("reverted to %s", saved._id);

            callback(null, saved);
          });
        }else{

          callback(new Error("Unable to locate revision"));
        }


      });

//      callback();
    });



  }else{
    throw new Error("Must specify collection for history");
  }


};
