//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

// DB include mongoose //////////////////
const mongoose = require("mongoose");
/////////////////////////////////////////

mongoose.set('strictQuery', false);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// DB connect /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// mongoose.connect("mongodb+srv://teoz:teoz@learningcluster.f9o4af5.mongodb.net/newDB, {
mongoose.connect("mongodb+srv://teoz:teoz@learningcluster.f9o4af5.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true
});
// DB create schema
const itemsSchema = {
  name: String
};
// DB create model
const Item = mongoose.model("Item", itemsSchema);
// DB create documents
const item1 = new Item({
  name: "Welcome to your todoList!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// per il get dinamico /:customListName
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {
  // DB find all documents e invia /////////////////////////////////////////////////
  // find() gives back a list
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      //DB insertMany
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
  ///////////////////////////////////////////////////////////////////////


});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list; // list è il name del button

  const newItem = new Item({name: itemName});
  /////////////////////////////////////////////////////////

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }


});


app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today")
  {
    Item.findByIdAndRemove(checkedItemId, function(err)
    {
      if (err)
      {
        console.log(err);
      }
      else
      {
        console.log("Successfully removed (from list " + listName + ") item with id > " + checkedItemId);
      }
    });
    res.redirect("/");
  }
  else
  {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // findOne() gives back an object, "foundList"
  List.findOne({name: customListName}, function(err, foundList)
  {
    if (!err)
    {
      if (!foundList)
      {
        console.log("Lista " + customListName + " non esiste!");
        //create a new list
        const list = new List(
        {
          name: customListName,
          items: defaultItems //lo popolo con gli elementi di prima
        });
        list.save();
        console.log("Lista " + customListName + " creata! Ora redirect to /" + customListName);
        res.redirect("/" + customListName);
      }
      else
      {
        console.log("Lista " + foundList.name + " esiste! La mostro sul browser!");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});


app.get("/about", function(req, res) {
  res.render("about");
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
