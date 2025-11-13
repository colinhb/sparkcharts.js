MKSHELL=rc

js_file=sparkcharts.js
html_file=index.html
style_files=styles.css normalize.css

deploy_script=deploy.sh
deploy_dir=public

tidy_config=tidy-config.txt

all:V: $deploy_script

clean: 
	rm $deploy_script
	rm -f $deploy_dir/*

tidy:V: $html_file $tidy_config
	# if tidy-html5 is installed, use it to format index.html in place
	if (which tidy) {
		v=`{tidy -v | awk '{print $NF}' | cut -d. -f1}
		if (~ $v 5) {
			echo 'tidy-html5 found; attempting to format index.html'
			tidy -config $tidy_config -m $html_file
		}
		if not echo 'tidy-html5 NOT FOUND; skipping HTML formatting'
	}
	if not echo 'no version of tidy found; skipping HTML formatting'

$deploy_script: $js_file $html_file $style_files
	mkdir -p `{basename -d $target}
	echo '#!/bin/sh' > $target
	echo set -eux >> $target
	echo mkdir -p $deploy_dir >> $target
	echo cp $js_file $deploy_dir >> $target
	echo cp $html_file $deploy_dir >> $target
	echo cp $style_files $deploy_dir >> $target
	chmod +x $target
