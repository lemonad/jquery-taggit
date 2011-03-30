/*
Copyright (c) 2010 Jonas Nockert and individual contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

(function( $ ) {

$.fn.taggit = function( options ) {

    /*
    Updates the suggestion highlighting based on the tags input field.

    */
    var check_suggestions = function( input_field,
                                      tag_suggestions_selector ) {
        var tags_text = input_field.val();
        var tags = $.fn.taggit.parse_tags( tags_text );

        /* Add suggested tags as well as marking them as used or
           not used based on the tags input field */
        $( tag_suggestions_selector ).each(function( index ) {
            if ( $.inArray( $( this ).text(), tags ) >= 0 ) {
                if ( ! $( this ).hasClass( "taggit-tag-used" ) ) {
                    $( this ).addClass( "taggit-tag-used" );
                }
            } else {
                if ( $( this ).hasClass( "taggit-tag-used" ) ) {
                    $( this ).removeClass( "taggit-tag-used" );
                }
            }
        });
    };

    /*
    Keyup handler.

    */
    var keyup = function( e ) {
        var input_field = $( this );

        input_field.stopTime( "taggit-check-suggestions" );
        input_field.oneTime( 300, "taggit-check-suggestions", function() {
            check_suggestions( input_field, e.data.tag_suggestions_selector );
        });
    };

    /*
    Main JQuery extension. It's chaining but should not be expected
    to give proper results if called with a selector matching multiple
    elements.

    */
    return this.each(function() {
        var input_field = $( this );

        // Merge options with the default settings
        if ( options ) {
            $.fn.taggit.settings = $.extend( {},
                                             $.fn.taggit.settings,
                                             options );
        }

        var tag_suggestions_selector = $.fn.taggit.settings.tag_selector;

        input_field.taggit_options = options;

        if ( input_field && tag_suggestions_selector ) {
            var tags_text = input_field.val();
            var tags = $.fn.taggit.parse_tags( tags_text );

            // bind click on suggestion tags
            $( tag_suggestions_selector ).click(function() {
                var tag = $( this );
                var tag_text = tag.text();
                var tags_text = input_field.val();
                var tags = $.fn.taggit.parse_tags( tags_text );

                var index = $.inArray( tag_text, tags );
                if ( index < 0 ) {
                    tag.addClass( "taggit-tag-used" );
                    tags.push( tag_text );
                } else {
                    tag.removeClass( "taggit-tag-used" );
                    tags.splice( index, 1 );
                }
                input_field.val( $.fn.taggit.edit_string_for_tags( tags ) );

                /* Handle duplicate suggestion tags. E.g. when listing
                   both tag suggestions from user and community. Clicking
                   a tag should highlight it in both lists. */
                check_suggestions( input_field, tag_suggestions_selector );
            });
        }

        var eventdata = { tag_suggestions_selector:
                          tag_suggestions_selector };
        $( this ).keyup( eventdata, keyup );

        // Handle input field initial value
        check_suggestions( input_field, tag_suggestions_selector );
    });
};

$.fn.taggit.settings = {
    'case_handling' : 'case-sensitive'
};

/*
Removes duplicate entries from an array.

*/
$.fn.taggit.uniqify_array = function( a ) {
    var case_handling = $.fn.taggit.settings.case_handling;
    var u = [];
    var u_lower = [];

    for ( var i = 0; i < a.length; i++ ) {
        var val = a[i];
        if ( case_handling === "case-sensitive" ) {
            /* Case sensitive. "Apple, APPLE" -> "Apple, APPLE" */
            if ( $.inArray( val, u ) === -1 ) {
                u.push( val );
            }
        } else if ( case_handling === "case-insensitive" ) {
            /* Case insensitive, pick first. "Apple, APPLE" -> "Apple" */
            if ( $.inArray( val.toLowerCase(), u_lower ) === -1 ) {
                u.push( val );
                u_lower.push( val.toLowerCase() );
            }
        } else if ( case_handling === "lower-case" ) {
            /* All lower case. "Apple, APPLE" -> "apple" */
            val = val.toLowerCase();
            if ( $.inArray( val, u ) === -1 ) {
                u.push( val );
            }
        }
    }
    return u;
};

/*
Splits a string into individual tags. Returns an array of trimmed,
non-empty tags.

Based on Alex Gaynor's django-taggit:
https://github.com/alex/django-taggit/
which in turn was ported from Jonathan Buchanan's django-tagging:
http://django-tagging.googlecode.com/

*/
$.fn.taggit.split_strip = function( tags_string, delimiter ) {
    if ( delimiter === undefined ) {
        delimiter = ",";
    }

    var tags = [];
    var split_tags = tags_string.split( delimiter );
    for ( var i = 0; i < split_tags.length; i++ ) {
        var tag = $.trim( split_tags[i] );
        if ( tag.length > 0 ) {
            tags.push( tag );
        }
    }
    return tags;
};


/*
Parses a tag string, comma- or space-separated. Tags containing commas
need to be double quoted.

Returns a sorted list of unique tag names.

Based on Alex Gaynor's django-taggit:
https://github.com/alex/django-taggit/
which in turn was ported from Jonathan Buchanan's django-tagging:
http://django-tagging.googlecode.com/

*/
$.fn.taggit.parse_tags = function( tagstring ) {
    tagstring = $.trim( tagstring );

    if ( tagstring.length <= 0 ) {
        return [];
    }

    // No commas or quotes?
    if ( ! ( /[,\"]/.test( tagstring ) ) ) {
        words = tagstring.split( " " );

        // remove duplicate tags
        words = $.fn.taggit.uniqify_array( words );

        // Sort tags
        return words.sort();
    }

    var words = [];
    var buffer = [];
    /* Defer splitting of non-quoted sections until we know if there are
       any unquoted commas. */
    var to_be_split = [];
    var saw_loose_comma = false;
    var open_quote = false;

    try {
        var i = 0;
        var c;

        while ( true ) {
            if ( i >= tagstring.length ) {
                throw "stopiteration";
            }
            c = tagstring.charAt(i++);
            if ( c == "\"" ) {
                var trimmed_buffer = $.trim( buffer.join( "" ) );
                if ( trimmed_buffer.length > 0 ) {
                    to_be_split.push( trimmed_buffer );
                    buffer = [];
                }
                // Find the matching quote
                open_quote = true;
                if ( i >= tagstring.length ) {
                    throw "stopiteration";
                }
                c = tagstring.charAt(i++);
                while ( c != "\"" ) {
                    buffer.push( c );
                    if ( i >= tagstring.length ) {
                        throw "stopiteration";
                    }
                    c = tagstring.charAt(i++);
                }
                trimmed_buffer = $.trim( buffer.join( "" ) );
                if ( trimmed_buffer.length > 0 ) {
                    var trimmed_word = $.trim( trimmed_buffer );
                    if ( trimmed_word.length > 0 ) {
                        words.push( trimmed_word );
                    }
                    buffer = [];
                }
                open_quote = false;
            } else {
                if ( ! saw_loose_comma && c === "," ) {
                    saw_loose_comma = true;
                }
                buffer.push( c );
            }
        }
    } catch( e ) {
        if ( e != "stopiteration" ) {
            throw e;
        }

        /* If we were parsing an open quote which was never closed treat
           the buffer as unquoted. */
        if ( buffer.length > 0 ) {
            if ( open_quote && $.inArray( ",", buffer ) >= 0 ) {
                saw_loose_comma = true;
            }
            to_be_split.push( buffer.join( "" ) );
        }
    }

    if ( to_be_split.length > 0 ) {
        var delimiter;

        if ( saw_loose_comma ) {
            delimiter = ",";
        } else {
            delimiter = " ";
        }
        for ( var chunk in to_be_split ) {
            var split_words = $.fn.taggit.split_strip( to_be_split[chunk],
                                                       delimiter );
            for ( var word in split_words ) {
                words.push( split_words[word] );
            }
        }
    }

    // remove duplicate tags
    words = $.fn.taggit.uniqify_array( words );

    // Sort tags
    return words.sort();
};

/*
Given an array of tags, e.g. produced by parse_tags, returns a
comma-separated string representation that, if sent to parse_tags
would yield the same results as we started with (albeit perhaps
sorted differently).

Based on Alex Gaynor's django-taggit:
https://github.com/alex/django-taggit/
which in turn was ported from Jonathan Buchanan's django-tagging:
http://django-tagging.googlecode.com/

*/
$.fn.taggit.edit_string_for_tags = function( tags ) {
    var names = [];

    for ( var tag in tags ) {
        var name = tags[tag];
        if ( name.indexOf( "," ) >= 0 || name.indexOf( " " ) >= 0 ) {
            names.push( "\"" + name + "\"" );
        } else {
            names.push( name );
        }
    }
    names.sort();
    return names.join( ", " );
};

})( jQuery );
