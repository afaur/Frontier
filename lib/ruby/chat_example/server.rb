# Where to serve static files
# ../../.. because we are in lib/ruby/chat_example
PUB_PATH = File.expand_path( File.dirname(__FILE__) ) + '/../../../public/chat_example'

# Allows us to always serve the index.html after the static route handler
# and the ruby route handler have been checked at the bottom.
class SPA
  def index
    return File.read("#{PUB_PATH}/index.html")
  end
end

class BroadcastCtrl

  # This would handle an http request to /ws/
  def index
    redirect_to 'http://www.websocket.org/echo.html'
  end

  # Right before we decide to open the ws connection or not
  def pre_connect
    return false if params[:name].nil?
    true
  end

  # When a websocket connection is opened
  def on_open

    # Must pass a nickname
    if params[:name].nil?
      response << {event: :error, from: :system, at: Time.now, message: "Error: cannot connect without a nickname!"}.to_json
      response.close
      return false
    end

    # Can't use admin nicknames
    message = {from: '', at: Time.now}
    name = params[:name]
    if (name.downcase.match(/admin|admn|system|sys|administrator/i))
      message[:event] = :error
      message[:message] = "The nickname '#{name}' is already taken."
      response << message.to_json
      params[:name] = false
      response.close
      return
    end

    # Welcome user to chat
    message = {from: '', at: Time.now}
    message[:event] = :chat
    response << message.to_json
    message[:message] = "#{params[:name]} joined the chatroom."
    broadcast :_send_message, message.to_json
    # Explain who is here or if your the first one here
    #message[:message] = list.empty? ? "You're the first one here." : "#{list[0..-2].join(', ')} #{list[1] ? 'and' : ''} #{list.last} #{list[1] ? 'are' : 'is'} already in the chatroom"
  end

  # When a user disconnects from the websocket connection
  def on_disconnect
    # Let others know that the user left
    broadcast :_send_message, {event: :chat, from: '', at: Time.now, message: "#{params[:name]} left the chatroom."}.to_json if params[:name]
  end

  # When we get a message from one of the websocket users
  def on_message data
    begin
      data = JSON.parse data
    rescue Exception => e
      puts e
      response << {event: :error, message: "Unknown Error"}.to_json
      response.close
      return false
    end
    broadcast :_send_message, {event: :chat, from: params[:name], message: data['message'], at: Time.now}.to_json
  end

  # Private method we can use to send data back
  def _send_message data
    response << data
  end

end

# start to listen and set the root path for serving files.
listen public: PUB_PATH

# Handle websocket traffic
route '/ws/:name', BroadcastCtrl

# Route everything else to the SPA to allow us to return our SPA on other
# Request routes
route '*', SPA
