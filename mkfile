MKSHELL=rc

index_html=index.html
tidy_config=tidy-config.txt

tidy:V: $index_html $tidy_config
	# if tidy-html5 is installed, use it to format index.html in place
	if (which tidy) {
		v=`{tidy -v | awk '{print $NF}' | cut -d. -f1}
		if (~ $v 5) {
			echo 'tidy-html5 found; attempting to format index.html'
			tidy -config $tidy_config -m $index_html
		}
		if not echo 'tidy-html5 NOT FOUND; skipping HTML formatting'
	}
	if not echo 'no version of tidy found; skipping HTML formatting'
