MKSHELL=rc

script_file=sparkcharts.js
index_html=index.html
tidy_config=tidy-config.txt

deploy_dir=public
deploy_script=deploy.sh
style_files=styles.css normalize.css

all:V: $deploy_script

clean: 
	rm $deploy_script
	rm -f $deploy_dir/*

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

$deploy_script: $script_file $index_html $style_files
	mkdir -p `{basename -d $target}
	echo '#!/bin/sh' > $target
	echo set -eux >> $target
	echo mkdir -p $deploy_dir >> $target
	echo cp $index_html $deploy_dir >> $target
	echo cp $script_file $deploy_dir >> $target
	echo cp $style_files $deploy_dir >> $target
	chmod +x $target
