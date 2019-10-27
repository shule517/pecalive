class Api::V1::ChannelsController < ApplicationController
  def index
    render json: get_channels
  end

  private

  def get_channels
    Rails.cache.fetch('get_channels', expires_in: 1.minute) do
      peca_tip = 'http://150.95.177.111:7144'
      api = JsonRpc.new("#{peca_tip}/api/1")
      channels = api.update_yp_channels
      channels = channels.select { |channel| visible_channel?(channel) }
      channels
    end
  end

  def visible_channel?(channel)
    return false if channel['channelId'] == '00000000000000000000000000000000'
    return false if channel['contentType'] == 'FLV'
    return false if ignore_channel?(channel['name'])
    true
  end

  def ignore_channel?(channel_name)
    %w(isuZuﾋﾟﾁｭｰﾝch).include?(channel_name)
  end
end
