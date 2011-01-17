jquery-taggit
=============

A jQuery companion for [django-taggit](https://github.com/alex/django-taggit),
matching its method of parsing. Excluding edge cases, the following quote
covers the basic principle:

> "If any tag name which isn't being quoted contains whitespace, the
>  resulting string of tag names will be comma-delimited, otherwise
>  it will be space-delimited."


Example
-------
![Example](https://github.com/lemonad/jquery-taggit/raw/master/example/example.png)


How to use
----------
Add ``jquery-taggit`` and related dependencies to your html. Add an id or
class to your taggit input form field, e.g. ``#tags``, and give each tag
suggestion a class name, say ``.taggit-tag``:

    <input id="tags" name="tags" type="text" value="apple, cat"></input>
    <ul id="suggested-tags">
        <li class="taggit-tag">apple</li>
        <li class="taggit-tag">ball</li>
        <li class="taggit-tag">cat</li>
        <li class="taggit-tag">dog</li>
    </ul>

Then call ``taggit`` on the tag input field with ``tag_selector`` set to the
jQuery selector for the tag suggestion elements:

    $( "#tags" ).taggit( { tag_selector: "#suggested-tags .taggit-tag" } );

Clicking a tag will add/remove the class name ``taggit-tag-used`` for it.

If the tag input field has an initial value defined, calling ``taggit``
will automatically mark all matching tag suggestions with the
``taggit-tag-used`` class name.


Dependencies
------------
*  ``jQuery``
*  ``jQuery.timers``
*  ``QUnit`` (only for testing)


Testing
-------
Open ``example/test.html`` in a web browser. All ``QUnit`` tests should be
expected to pass.


Todo
----
*  Show tag suggestions while typing.
*  Testing for functionality beyond django-tagging compatibility.
