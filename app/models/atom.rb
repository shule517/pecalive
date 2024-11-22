class Atom
  attr_reader :bytes, :children

  TYPE_LENGTH = 4
  SIZE_LENGTH = 4
  HEADER_LENGTH = TYPE_LENGTH + SIZE_LENGTH

  def initialize(io)
    @bytes = io.read(HEADER_LENGTH).bytes.to_bytes
    @children = []

    if has_children?
      @children = size.times.map { Atom.new(io) }
    else
      @bytes += io.read(size).bytes.to_bytes
    end
  end

  def type
    bytes.first(TYPE_LENGTH).to_s
  end

  def has_children?
    # 先頭1ビットは子供Atomが存在するかどうかを示す
    (size_raw & 0x80000000) != 0
  end

  def size
    # 2ビット目以降は、1ビット目によって意味が変わる
    # 先頭1ビットが1の場合：子供Atomの数
    # 先頭1ビットが0の場合：データの長さ(byte)
    size_raw & 0x7FFFFFF
  end

  def data
    bytes.substring(8, size)
  end

  private

  def size_raw
    bytes.substring(TYPE_LENGTH, SIZE_LENGTH).to_i
  end
end
