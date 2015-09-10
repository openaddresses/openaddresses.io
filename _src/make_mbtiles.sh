# installs dependencies, downloads data & regenerates mbtiles for all of OpenAddresses
# assumes appropriate AWS credentials in environment variables

set -e

ROOTDIR=`pwd`

rm -rf $ROOTDIR/tippecanoe $ROOTDIR/build.csv $ROOTDIR/openaddresses-collected.zip $ROOTDIR/openaddresses-download

sudo apt-get update -y
sudo apt-get install -y git make g++ libsqlite3-dev protobuf-compiler libprotobuf-dev awscli nodejs
git clone https://github.com/mapbox/tippecanoe.git
cd $ROOTDIR/tippecanoe && make
curl https://raw.githubusercontent.com/sbma44/monoxylon/master/monoxylon.js > $ROOTDIR/tippecanoe/monoxylon.js

# download OpenAddresses data
mkdir $ROOTDIR/openaddresses-download
cd $ROOTDIR/openaddresses-download
curl 'http://data.openaddresses.io/openaddresses-collected.zip' -o $ROOTDIR/openaddresses-collected.zip
unzip -o -d $ROOTDIR/openaddresses-download $ROOTDIR/openaddresses-collected.zip # && rm $ROOTDIR/openaddresses-collected.zip
find $ROOTDIR/openaddresses-download -type f -name '*.csv' | xargs -I {} $ROOTDIR/concat.sh {} $ROOTDIR/build.csv

# build mbtiles
# NOTE: the "-r 1.5" flag is aggressive about retaining geometry, producing a very
# large mbtiles tile. Increasing this value is probably wise. Tippecanoe's default is 
# 2.5, which is too high to produce pleasing results.
cat $ROOTDIR/build.csv | nodejs $ROOTDIR/tippecanoe/monoxylon.js | $ROOTDIR/tippecanoe/tippecanoe -b 0 -r 2 -l "openaddresses" -X -n "OpenAddresses `date`" -f -o $ROOTDIR/openaddresses.mbtiles 2>/dev/null


# upload & replace existing source if appropriate 
if [ -n "$MapboxAccessToken" ]
then
    sudo apt-get install -y npm
    git clone https://github.com/mapbox/mapbox-upload.git $ROOTDIR/mapbox-upload
    cd $ROOTDIR/mapbox-upload
    npm install
    nodejs $ROOTDIR/mapbox-upload/bin/upload.js open-addresses.lec54np1 $ROOTDIR/openaddresses.mbtiles
fi
