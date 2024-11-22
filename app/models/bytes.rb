class Bytes
  attr_reader :bytes
  delegate :size, to: :bytes

  def initialize(bytes)
    @bytes = bytes
  end

  def [](index)
    bytes[index]
  end

  def +(other)
    Bytes.new(bytes + other.bytes)
  end

  def first(length = 1)
    bytes.first(length).to_bytes
  end

  def substring(start, length = nil)
    if length.present?
      bytes[start...start+length].to_bytes
    else
      bytes[start..].to_bytes
    end
  end

  def to_i
    bytes.map.with_index do |byte, index|
      byte << index * 8 # little endian
    end.sum
  end

  def to_s
    bytes.map(&:chr).join
  end

  def to_a
    bytes
  end

  def to_hex
    bytes.map { |byte| byte.to_s(16).upcase }.join
  end
end
