# Where to serve static files
# ../../.. because we are in lib/ruby/chat_example
PUB_PATH = File.expand_path( File.dirname(__FILE__) ) + '/../../../public/bookmark_example'

# Allows us to always serve the index.html after the static route handler
# and the ruby route handler have been checked at the bottom.
class SPA
  def index
    return File.read("#{PUB_PATH}/index.html")
  end
end

# start to listen and set the root path for serving files.
listen public: PUB_PATH

# Route everything else to the SPA to allow us to return our SPA on other
# Request routes
route '*', SPA
